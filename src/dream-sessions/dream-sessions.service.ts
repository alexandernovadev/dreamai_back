import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DreamKind, DreamSessionStatus } from '../domain/enums';
import { DreamSession } from '../schemas/dream-session.schema';
import type { DreamSessionDocument } from '../schemas/dream-session.schema';
import { extractCatalogIdsFromDreamsJson } from './dream-session-catalog.util';
import {
  DreamSessionValidationService,
  type DreamSessionValidateInput,
} from './dream-session-validation.service';
import { CreateDreamSessionDto } from './dto/create-dream-session.dto';
import { DreamSessionsQueryDto } from './dto/dream-sessions-query.dto';
import { UpdateDreamSessionDto } from './dto/update-dream-session.dto';

@Injectable()
export class DreamSessionsService {
  constructor(
    @InjectModel(DreamSession.name)
    private readonly dreamSessionModel: Model<DreamSessionDocument>,
    private readonly validation: DreamSessionValidationService,
  ) {}

  async findAll(query?: DreamSessionsQueryDto) {
    const filter: Record<string, unknown> = {};
    const and: Record<string, unknown>[] = [];
    if (query?.catalogCharacterId) {
      and.push({ catalogCharacterIds: query.catalogCharacterId });
    }
    if (query?.catalogLocationId) {
      and.push({ catalogLocationIds: query.catalogLocationId });
    }
    if (query?.catalogObjectId) {
      and.push({ catalogObjectIds: query.catalogObjectId });
    }
    if (query?.lifeEventId) {
      and.push({ relatedLifeEventIds: query.lifeEventId });
    }
    if (and.length > 0) {
      filter.$and = and;
    }
    const docs = await this.dreamSessionModel
      .find(filter)
      .sort({ timestamp: -1 })
      .exec();
    return docs.map((d) => d.toJSON());
  }

  async findOne(id: string) {
    const doc = await this.dreamSessionModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    return doc.toJSON();
  }

  async create(dto: CreateDreamSessionDto) {
    const dreamsArray = this.toDreamArray(dto.dreams);
    await this.validation.assertValid({
      status: dto.status,
      dreamKind: dto.dreamKind,
      userThought: dto.userThought,
      relatedLifeEventIds: dto.relatedLifeEventIds ?? [],
      dreams: dreamsArray,
    });
    const derived = extractCatalogIdsFromDreamsJson(dreamsArray);
    const created = await this.dreamSessionModel.create({
      timestamp: new Date(dto.timestamp),
      status: dto.status,
      dreamKind: dto.dreamKind,
      rawNarrative: dto.rawNarrative,
      relatedLifeEventIds: dto.relatedLifeEventIds ?? [],
      userThought: dto.userThought,
      dreams: dreamsArray,
      catalogCharacterIds: derived.catalogCharacterIds,
      catalogLocationIds: derived.catalogLocationIds,
      catalogObjectIds: derived.catalogObjectIds,
    });
    return created.toJSON();
  }

  async update(id: string, dto: UpdateDreamSessionDto) {
    const existing = await this.findOne(id);
    const merged = this.mergeForValidation(existing, dto);
    await this.validation.assertValid(merged);

    const $set: Record<string, unknown> = {};
    if (dto.timestamp !== undefined) {
      $set.timestamp = new Date(dto.timestamp);
    }
    if (dto.status !== undefined) {
      $set.status = dto.status;
    }
    if (dto.dreamKind !== undefined) {
      $set.dreamKind = dto.dreamKind;
    }
    if (dto.rawNarrative !== undefined) {
      $set.rawNarrative = dto.rawNarrative;
    }
    if (dto.relatedLifeEventIds !== undefined) {
      $set.relatedLifeEventIds = dto.relatedLifeEventIds;
    }
    if (dto.userThought !== undefined) {
      $set.userThought = dto.userThought;
    }
    if (dto.dreams !== undefined) {
      const dreams = this.toDreamArray(dto.dreams);
      $set.dreams = dreams;
      const derived = extractCatalogIdsFromDreamsJson(dreams);
      $set.catalogCharacterIds = derived.catalogCharacterIds;
      $set.catalogLocationIds = derived.catalogLocationIds;
      $set.catalogObjectIds = derived.catalogObjectIds;
    }

    const doc = await this.dreamSessionModel
      .findByIdAndUpdate(id, { $set }, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    return doc.toJSON();
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.dreamSessionModel.findByIdAndDelete(id).exec();
  }

  private mergeForValidation(
    existing: Record<string, unknown>,
    dto: UpdateDreamSessionDto,
  ): DreamSessionValidateInput {
    return {
      status: (dto.status ?? existing.status) as DreamSessionStatus,
      dreamKind: (dto.dreamKind ?? existing.dreamKind) as DreamKind,
      userThought:
        dto.userThought !== undefined
          ? dto.userThought
          : (existing.userThought as string | null | undefined),
      relatedLifeEventIds:
        dto.relatedLifeEventIds ?? (existing.relatedLifeEventIds as string[]),
      dreams:
        dto.dreams !== undefined
          ? this.toDreamArray(dto.dreams)
          : this.jsonToDreamArray(existing.dreams),
    };
  }

  private toDreamArray(value: unknown[] | undefined): unknown[] {
    if (value === undefined) {
      return [];
    }
    if (!Array.isArray(value)) {
      throw new UnprocessableEntityException('dreams must be a JSON array');
    }
    return value;
  }

  private jsonToDreamArray(json: unknown): unknown[] {
    if (json === null || json === undefined) {
      return [];
    }
    if (!Array.isArray(json)) {
      throw new UnprocessableEntityException(
        'stored dreams must be a JSON array',
      );
    }
    return json as unknown[];
  }
}

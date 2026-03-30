import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Character } from '../character/schemas/character.schema';
import { ContextLife } from '../context-life/schemas/context-life.schema';
import { DreamEvent } from '../dream-event/schemas/dream-event.schema';
import { DreamObject } from '../dream-object/schemas/dream-object.schema';
import { Feeling } from '../feeling/schemas/feeling.schema';
import { Location } from '../location/schemas/location.schema';
import { escapeRegex } from '../common/utils/escape-regex';
import { CreateDreamSessionDto } from './dto/create-dream-session.dto';
import { DreamEntitiesInputDto } from './dto/dream-entities-input.dto';
import { QueryDreamSessionsDto } from './dto/query-dream-sessions.dto';
import { UpdateDreamSessionDto } from './dto/update-dream-session.dto';
import {
  DreamSession,
  DreamSessionDocument,
} from './schemas/dream-session.schema';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class DreamSessionService {
  constructor(
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<unknown>,
    @InjectModel(Location.name)
    private locationModel: Model<unknown>,
    @InjectModel(DreamObject.name)
    private dreamObjectModel: Model<unknown>,
    @InjectModel(DreamEvent.name)
    private dreamEventModel: Model<unknown>,
    @InjectModel(ContextLife.name)
    private contextLifeModel: Model<unknown>,
    @InjectModel(Feeling.name)
    private feelingModel: Model<unknown>,
  ) {}

  async create(dto: CreateDreamSessionDto): Promise<DreamSessionDocument> {
    if (dto.analysis?.entities) {
      await this.validateEntities(dto.analysis.entities);
    }
    const payload: Record<string, unknown> = {
      ...dto,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : undefined,
    };
    const doc = new this.dreamSessionModel(payload);
    return doc.save();
  }

  async findAll(query: QueryDreamSessionsDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.dreamSessionModel
        .find(filter as never)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.dreamSessionModel.countDocuments(filter as never).exec(),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<DreamSessionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    const doc = await this.dreamSessionModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    return doc;
  }

  async update(
    id: string,
    dto: UpdateDreamSessionDto,
  ): Promise<DreamSessionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    if (dto.analysis?.entities) {
      await this.validateEntities(dto.analysis.entities);
    }
    const update: Record<string, unknown> = { ...dto };
    if (dto.timestamp !== undefined) {
      update.timestamp = dto.timestamp ? new Date(dto.timestamp) : null;
    }
    const doc = await this.dreamSessionModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    return doc;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    const res = await this.dreamSessionModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
  }

  /**
   * Validates that every ObjectId in `entities` actually exists in its collection.
   * Runs all checks in parallel; throws 400 listing every missing id.
   */
  private async validateEntities(
    entities: DreamEntitiesInputDto,
  ): Promise<void> {
    const checks: Array<Promise<string | null>> = [];

    const assertExists = (
      model: Model<unknown>,
      id: string,
      label: string,
    ): Promise<string | null> =>
      model
        .exists({ _id: new Types.ObjectId(id) })
        .exec()
        .then((found) => (found ? null : `${label} ${id} not found`));

    for (const r of entities.characters ?? []) {
      checks.push(assertExists(this.characterModel, r.characterId, 'Character'));
    }
    for (const r of entities.locations ?? []) {
      checks.push(assertExists(this.locationModel, r.locationId, 'Location'));
    }
    for (const r of entities.objects ?? []) {
      checks.push(assertExists(this.dreamObjectModel, r.objectId, 'DreamObject'));
    }
    for (const r of entities.events ?? []) {
      checks.push(assertExists(this.dreamEventModel, r.eventId, 'DreamEvent'));
    }
    for (const r of entities.contextLife ?? []) {
      checks.push(
        assertExists(this.contextLifeModel, r.contextLifeId, 'ContextLife'),
      );
    }
    for (const r of entities.feelings ?? []) {
      checks.push(assertExists(this.feelingModel, r.feelingId, 'Feeling'));
    }

    if (checks.length === 0) return;

    const results = await Promise.all(checks);
    const missing = results.filter(Boolean) as string[];

    if (missing.length > 0) {
      throw new BadRequestException(missing);
    }
  }

  private buildFilter(query: QueryDreamSessionsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.rawNarrative !== undefined && query.rawNarrative.trim() !== '') {
      filter.rawNarrative = {
        $regex: escapeRegex(query.rawNarrative.trim()),
        $options: 'i',
      };
    }

    if (query.dreamKind !== undefined && query.dreamKind.trim() !== '') {
      filter.dreamKind = query.dreamKind.trim();
    }

    if (query.timestampFrom || query.timestampTo) {
      const range: Record<string, Date> = {};
      if (query.timestampFrom) {
        range.$gte = new Date(query.timestampFrom);
      }
      if (query.timestampTo) {
        range.$lte = new Date(query.timestampTo);
      }
      filter.timestamp = range;
    }

    if (query.createdFrom || query.createdTo) {
      const range: Record<string, Date> = {};
      if (query.createdFrom) {
        range.$gte = new Date(query.createdFrom);
      }
      if (query.createdTo) {
        range.$lte = new Date(query.createdTo);
      }
      filter.createdAt = range;
    }

    return filter;
  }
}

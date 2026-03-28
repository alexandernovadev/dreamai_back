import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DreamSession, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { extractCatalogIdsFromDreamsJson } from './dream-session-catalog.util';
import { DreamSessionValidationService } from './dream-session-validation.service';
import { CreateDreamSessionDto } from './dto/create-dream-session.dto';
import { DreamSessionsQueryDto } from './dto/dream-sessions-query.dto';
import { UpdateDreamSessionDto } from './dto/update-dream-session.dto';

@Injectable()
export class DreamSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: DreamSessionValidationService,
  ) {}

  findAll(query?: DreamSessionsQueryDto) {
    const where: Prisma.DreamSessionWhereInput = {};
    const and: Prisma.DreamSessionWhereInput[] = [];
    if (query?.catalogCharacterId) {
      and.push({
        catalogCharacterIds: { has: query.catalogCharacterId },
      });
    }
    if (query?.catalogLocationId) {
      and.push({
        catalogLocationIds: { has: query.catalogLocationId },
      });
    }
    if (query?.catalogObjectId) {
      and.push({
        catalogObjectIds: { has: query.catalogObjectId },
      });
    }
    if (query?.lifeEventId) {
      and.push({
        relatedLifeEventIds: { has: query.lifeEventId },
      });
    }
    if (and.length > 0) {
      where.AND = and;
    }
    return this.prisma.dreamSession.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.dreamSession.findUnique({
      where: { id },
    });
    if (!session) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    return session;
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
    const dreams = dreamsArray as Prisma.InputJsonValue;
    const derived = extractCatalogIdsFromDreamsJson(dreams);
    return this.prisma.dreamSession.create({
      data: {
        timestamp: new Date(dto.timestamp),
        status: dto.status,
        dreamKind: dto.dreamKind,
        rawNarrative: dto.rawNarrative,
        relatedLifeEventIds: dto.relatedLifeEventIds ?? [],
        userThought: dto.userThought,
        dreams,
        catalogCharacterIds: derived.catalogCharacterIds,
        catalogLocationIds: derived.catalogLocationIds,
        catalogObjectIds: derived.catalogObjectIds,
      },
    });
  }

  async update(id: string, dto: UpdateDreamSessionDto) {
    const existing = await this.findOne(id);
    const merged = this.mergeForValidation(existing, dto);
    await this.validation.assertValid(merged);

    const data: Prisma.DreamSessionUpdateInput = {};
    if (dto.timestamp !== undefined) {
      data.timestamp = new Date(dto.timestamp);
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.dreamKind !== undefined) {
      data.dreamKind = dto.dreamKind;
    }
    if (dto.rawNarrative !== undefined) {
      data.rawNarrative = dto.rawNarrative;
    }
    if (dto.relatedLifeEventIds !== undefined) {
      data.relatedLifeEventIds = { set: dto.relatedLifeEventIds };
    }
    if (dto.userThought !== undefined) {
      data.userThought = dto.userThought;
    }
    if (dto.dreams !== undefined) {
      const dreams = dto.dreams as Prisma.InputJsonValue;
      data.dreams = dreams;
      const derived = extractCatalogIdsFromDreamsJson(dreams);
      data.catalogCharacterIds = { set: derived.catalogCharacterIds };
      data.catalogLocationIds = { set: derived.catalogLocationIds };
      data.catalogObjectIds = { set: derived.catalogObjectIds };
    }
    return this.prisma.dreamSession.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.dreamSession.delete({
      where: { id },
    });
  }

  private mergeForValidation(
    existing: DreamSession,
    dto: UpdateDreamSessionDto,
  ) {
    return {
      status: dto.status ?? existing.status,
      dreamKind: dto.dreamKind ?? existing.dreamKind,
      userThought:
        dto.userThought !== undefined ? dto.userThought : existing.userThought,
      relatedLifeEventIds: dto.relatedLifeEventIds ?? [
        ...existing.relatedLifeEventIds,
      ],
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

  private jsonToDreamArray(json: Prisma.JsonValue): unknown[] {
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { escapeRegex } from '../common/utils/escape-regex';
import { CreateDreamSessionDto } from './dto/create-dream-session.dto';
import { QueryDreamSessionsDto } from './dto/query-dream-sessions.dto';
import { UpdateDreamSessionDto } from './dto/update-dream-session.dto';
import {
  DreamSession,
  DreamSessionDocument,
} from './schemas/dream-session.schema';

/**
 * CRUD básico de sesiones de sueño (`dream_sessions`).
 *
 * TODO (IA): pipeline de resumen / `aiSummarize` (no en este servicio).
 * TODO (Elements): crear o enlazar entidades de catálogo y validar refs en `analysis.entities`.
 * Este servicio solo persiste lo que envía el cliente en `analysis` y campos raíz.
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class DreamSessionService {
  constructor(
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
  ) {}

  async create(dto: CreateDreamSessionDto): Promise<DreamSessionDocument> {
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

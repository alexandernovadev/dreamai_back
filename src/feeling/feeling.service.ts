import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CreateFeelingDto } from './dto/create-feeling.dto';
import { QueryFeelingsDto } from './dto/query-feelings.dto';
import { UpdateFeelingDto } from './dto/update-feeling.dto';
import { escapeRegex } from '../common/utils/escape-regex';
import { Feeling, FeelingDocument } from './schemas/feeling.schema';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class FeelingService {
  constructor(
    @InjectModel(Feeling.name)
    private feelingModel: Model<FeelingDocument>,
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
  ) {}

  async create(dto: CreateFeelingDto): Promise<FeelingDocument> {
    const doc = new this.feelingModel({
      kind: dto.kind,
      intensity: dto.intensity,
      notes: dto.notes,
      dreamSessionId: new Types.ObjectId(dto.dreamSessionId),
    });
    return doc.save();
  }

  async findAll(query: QueryFeelingsDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.feelingModel
        .find(filter as never)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.feelingModel.countDocuments(filter as never).exec(),
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

  async findOne(id: string) {
    const doc = await this.feelingModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Feeling ${id} not found`);
    }

    const feelingId = new Types.ObjectId(id);
    const dreamFilter: Record<string, Types.ObjectId> = {
      'analysis.entities.feelings.feelingId': feelingId,
    };

    const [dreams, count] = await Promise.all([
      this.dreamSessionModel
        .find(dreamFilter as never)
        .select({ _id: 1, timestamp: 1 })
        .sort({ timestamp: -1 })
        .lean()
        .exec(),
      this.dreamSessionModel.countDocuments(dreamFilter as never).exec(),
    ]);

    return {
      ...doc.toObject(),
      dreamAppearances: {
        count,
        dreams: dreams.map((d) => ({
          _id: d._id.toString(),
          timestamp: d.timestamp ?? null,
        })),
      },
    };
  }

  async update(id: string, dto: UpdateFeelingDto): Promise<FeelingDocument> {
    const update: Record<string, unknown> = {};
    if (dto.kind !== undefined) {
      update.kind = dto.kind;
    }
    if (dto.intensity !== undefined) {
      update.intensity = dto.intensity;
    }
    if (dto.notes !== undefined) {
      update.notes = dto.notes;
    }
    if (dto.dreamSessionId !== undefined) {
      update.dreamSessionId = new Types.ObjectId(dto.dreamSessionId);
    }
    const doc = await this.feelingModel
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`Feeling ${id} not found`);
    }
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.feelingModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`Feeling ${id} not found`);
    }
  }

  private buildFilter(query: QueryFeelingsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.kind !== undefined) {
      filter.kind = query.kind;
    }

    if (query.notes !== undefined && query.notes.trim() !== '') {
      filter.notes = {
        $regex: escapeRegex(query.notes.trim()),
        $options: 'i',
      };
    }

    if (
      query.dreamSessionId !== undefined &&
      query.dreamSessionId.trim() !== ''
    ) {
      filter.dreamSessionId = new Types.ObjectId(query.dreamSessionId);
    }

    if (query.intensityMin !== undefined || query.intensityMax !== undefined) {
      const range: { $gte?: number; $lte?: number } = {};
      if (query.intensityMin !== undefined) {
        range.$gte = query.intensityMin;
      }
      if (query.intensityMax !== undefined) {
        range.$lte = query.intensityMax;
      }
      filter.intensity = range;
    }

    if (query.createdFrom !== undefined || query.createdTo !== undefined) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (query.createdFrom !== undefined) {
        range.$gte = new Date(query.createdFrom);
      }
      if (query.createdTo !== undefined) {
        range.$lte = new Date(query.createdTo);
      }
      filter.createdAt = range;
    }

    if (query.updatedFrom !== undefined || query.updatedTo !== undefined) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (query.updatedFrom !== undefined) {
        range.$gte = new Date(query.updatedFrom);
      }
      if (query.updatedTo !== undefined) {
        range.$lte = new Date(query.updatedTo);
      }
      filter.updatedAt = range;
    }

    return filter;
  }
}

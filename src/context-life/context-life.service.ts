import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CreateContextLifeDto } from './dto/create-context-life.dto';
import { QueryContextLivesDto } from './dto/query-context-lives.dto';
import { UpdateContextLifeDto } from './dto/update-context-life.dto';
import { escapeRegex } from '../common/utils/escape-regex';
import {
  ContextLife,
  ContextLifeDocument,
} from './schemas/context-life.schema';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ContextLifeService {
  constructor(
    @InjectModel(ContextLife.name)
    private contextLifeModel: Model<ContextLifeDocument>,
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
  ) {}

  async create(dto: CreateContextLifeDto): Promise<ContextLifeDocument> {
    const doc = new this.contextLifeModel(dto);
    return doc.save();
  }

  async findAll(query: QueryContextLivesDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.contextLifeModel
        .find(filter as never)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.contextLifeModel.countDocuments(filter as never).exec(),
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
    const doc = await this.contextLifeModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`ContextLife ${id} not found`);
    }

    const contextLifeId = new Types.ObjectId(id);
    const idPath = 'analysis.entities.contextLife.contextLifeId';
    const dreamFilter = {
      $or: [
        { [idPath]: contextLifeId },
        { [idPath]: contextLifeId.toString() },
      ],
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

  async update(
    id: string,
    dto: UpdateContextLifeDto,
  ): Promise<ContextLifeDocument> {
    const doc = await this.contextLifeModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`ContextLife ${id} not found`);
    }
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.contextLifeModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`ContextLife ${id} not found`);
    }
  }

  private buildFilter(query: QueryContextLivesDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.titleExact !== undefined && query.titleExact.trim() !== '') {
      filter.title = query.titleExact.trim();
    } else if (query.title !== undefined && query.title.trim() !== '') {
      filter.title = {
        $regex: escapeRegex(query.title.trim()),
        $options: 'i',
      };
    }

    if (query.description !== undefined && query.description.trim() !== '') {
      filter.description = {
        $regex: escapeRegex(query.description.trim()),
        $options: 'i',
      };
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

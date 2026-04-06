import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CreateDreamEventDto } from './dto/create-dream-event.dto';
import { QueryDreamEventsDto } from './dto/query-dream-events.dto';
import { UpdateDreamEventDto } from './dto/update-dream-event.dto';
import { escapeRegex } from '../common/utils/escape-regex';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../common/constants/pagination';
import { DreamEvent, DreamEventDocument } from './schemas/dream-event.schema';

@Injectable()
export class DreamEventService {
  constructor(
    @InjectModel(DreamEvent.name)
    private dreamEventModel: Model<DreamEventDocument>,
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
  ) {}

  async create(dto: CreateDreamEventDto): Promise<DreamEventDocument> {
    const doc = new this.dreamEventModel({
      label: dto.label,
      description: dto.description,
      dreamSessionId: new Types.ObjectId(dto.dreamSessionId),
    });
    return doc.save();
  }

  async findAll(query: QueryDreamEventsDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.dreamEventModel
        .find(filter as never)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.dreamEventModel.countDocuments(filter as never).exec(),
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
    const doc = await this.dreamEventModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`DreamEvent ${id} not found`);
    }

    const eventId = new Types.ObjectId(id);
    const idPath = 'analysis.entities.events.eventId';
    const dreamFilter = {
      $or: [{ [idPath]: eventId }, { [idPath]: eventId.toString() }],
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
    dto: UpdateDreamEventDto,
  ): Promise<DreamEventDocument> {
    const update: Record<string, unknown> = {};
    if (dto.label !== undefined) {
      update.label = dto.label;
    }
    if (dto.description !== undefined) {
      update.description = dto.description;
    }
    if (dto.dreamSessionId !== undefined) {
      update.dreamSessionId = new Types.ObjectId(dto.dreamSessionId);
    }
    const doc = await this.dreamEventModel
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`DreamEvent ${id} not found`);
    }
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.dreamEventModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`DreamEvent ${id} not found`);
    }
  }

  private buildFilter(query: QueryDreamEventsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.labelExact !== undefined && query.labelExact.trim() !== '') {
      filter.label = query.labelExact.trim();
    } else if (query.label !== undefined && query.label.trim() !== '') {
      filter.label = {
        $regex: escapeRegex(query.label.trim()),
        $options: 'i',
      };
    }

    if (query.description !== undefined && query.description.trim() !== '') {
      filter.description = {
        $regex: escapeRegex(query.description.trim()),
        $options: 'i',
      };
    }

    if (
      query.dreamSessionId !== undefined &&
      query.dreamSessionId.trim() !== ''
    ) {
      filter.dreamSessionId = new Types.ObjectId(query.dreamSessionId);
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

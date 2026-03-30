import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CreateDreamObjectDto } from './dto/create-dream-object.dto';
import { QueryDreamObjectsDto } from './dto/query-dream-objects.dto';
import { UpdateDreamObjectDto } from './dto/update-dream-object.dto';
import { escapeRegex } from '../common/utils/escape-regex';
import {
  DreamObject,
  DreamObjectDocument,
} from './schemas/dream-object.schema';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class DreamObjectService {
  constructor(
    @InjectModel(DreamObject.name)
    private dreamObjectModel: Model<DreamObjectDocument>,
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
  ) {}

  async create(dto: CreateDreamObjectDto): Promise<DreamObjectDocument> {
    const doc = new this.dreamObjectModel(dto);
    return doc.save();
  }

  async findAll(query: QueryDreamObjectsDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.dreamObjectModel
        .find(filter as never)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.dreamObjectModel.countDocuments(filter as never).exec(),
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
    const doc = await this.dreamObjectModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`DreamObject ${id} not found`);
    }

    const objectId = new Types.ObjectId(id);
    const dreamFilter: Record<string, Types.ObjectId> = {
      'analysis.entities.objects.objectId': objectId,
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
    dto: UpdateDreamObjectDto,
  ): Promise<DreamObjectDocument> {
    const doc = await this.dreamObjectModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`DreamObject ${id} not found`);
    }
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.dreamObjectModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`DreamObject ${id} not found`);
    }
  }

  private buildFilter(query: QueryDreamObjectsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.nameExact !== undefined && query.nameExact.trim() !== '') {
      filter.name = query.nameExact.trim();
    } else if (query.name !== undefined && query.name.trim() !== '') {
      filter.name = {
        $regex: escapeRegex(query.name.trim()),
        $options: 'i',
      };
    }

    if (query.description !== undefined && query.description.trim() !== '') {
      filter.description = {
        $regex: escapeRegex(query.description.trim()),
        $options: 'i',
      };
    }

    if (query.hasImage === true) {
      filter.imageUri = { $exists: true, $nin: [null, ''] };
    } else if (query.hasImage === false) {
      filter.$or = [
        { imageUri: { $exists: false } },
        { imageUri: null },
        { imageUri: '' },
      ];
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { escapeRegex } from '../common/utils/escape-regex';
import { Location, LocationDocument } from './schemas/location.schema';

/**
 * CRUD de lugares (Location) y datos derivados.
 *
 * **Filtros en Mongo (`find` / `countDocuments`):**
 * Igual que en `CharacterService`: objeto `Record<...>` + `as never` en las consultas
 * por tipos dinámicos de Mongoose/ESLint.
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name)
    private locationModel: Model<LocationDocument>,
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
  ) {}

  async create(dto: CreateLocationDto): Promise<LocationDocument> {
    const doc = new this.locationModel(dto);
    return doc.save();
  }

  async findAll(query: QueryLocationsDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.locationModel
        .find(filter as never)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.locationModel.countDocuments(filter as never).exec(),
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

  /**
   * Un lugar por id + apariciones en sueños vía
   * `analysis.entities.locations.locationId` en `dream_sessions`.
   */
  async findOne(id: string) {
    const doc = await this.locationModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Location ${id} not found`);
    }

    const locationId = new Types.ObjectId(id);
    const dreamFilter: Record<string, Types.ObjectId> = {
      'analysis.entities.locations.locationId': locationId,
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

  async update(id: string, dto: UpdateLocationDto): Promise<LocationDocument> {
    const doc = await this.locationModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`Location ${id} not found`);
    }
    return doc;
  }

  async remove(id: string): Promise<void> {
    const res = await this.locationModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`Location ${id} not found`);
    }
  }

  private buildFilter(query: QueryLocationsDto): Record<string, unknown> {
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

    if (query.isFamiliar !== undefined) {
      filter.isFamiliar = query.isFamiliar;
    }

    if (query.setting !== undefined) {
      filter.setting = query.setting;
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CatalogBaseService } from '../common/base/catalog-base.service';
import { CreateFeelingDto } from './dto/create-feeling.dto';
import { QueryFeelingsDto } from './dto/query-feelings.dto';
import { UpdateFeelingDto } from './dto/update-feeling.dto';
import { Feeling, FeelingDocument } from './schemas/feeling.schema';

@Injectable()
export class FeelingService extends CatalogBaseService {
  protected readonly entityName = 'Feeling';
  protected readonly dreamIdPath = 'analysis.entities.feelings.feelingId';

  constructor(
    @InjectModel(Feeling.name) protected readonly model: Model<FeelingDocument>,
    @InjectModel(DreamSession.name)
    protected readonly sessionModel: Model<DreamSessionDocument>,
  ) {
    super();
  }

  async create(dto: CreateFeelingDto): Promise<FeelingDocument> {
    return new this.model({
      kind: dto.kind,
      intensity: dto.intensity,
      notes: dto.notes,
      dreamSessionId: new Types.ObjectId(dto.dreamSessionId),
    }).save();
  }

  async update(id: string, dto: UpdateFeelingDto): Promise<FeelingDocument> {
    const update: Record<string, unknown> = {};
    if (dto.kind !== undefined) update.kind = dto.kind;
    if (dto.intensity !== undefined) update.intensity = dto.intensity;
    if (dto.notes !== undefined) update.notes = dto.notes;
    if (dto.dreamSessionId !== undefined)
      update.dreamSessionId = new Types.ObjectId(dto.dreamSessionId);
    const doc = await this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException(`Feeling ${id} not found`);
    return doc;
  }

  protected buildFilter(query: QueryFeelingsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    if (query.kind !== undefined) filter.kind = query.kind;
    this.applyTextField(filter, 'notes', query.notes);
    if (query.dreamSessionId?.trim()) {
      filter.dreamSessionId = new Types.ObjectId(query.dreamSessionId);
    }
    if (query.intensityMin !== undefined || query.intensityMax !== undefined) {
      const range: { $gte?: number; $lte?: number } = {};
      if (query.intensityMin !== undefined) range.$gte = query.intensityMin;
      if (query.intensityMax !== undefined) range.$lte = query.intensityMax;
      filter.intensity = range;
    }
    this.applyDateRange(
      filter,
      'createdAt',
      query.createdFrom,
      query.createdTo,
    );
    this.applyDateRange(
      filter,
      'updatedAt',
      query.updatedFrom,
      query.updatedTo,
    );
    return filter;
  }
}

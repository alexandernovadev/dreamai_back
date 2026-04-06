import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CatalogBaseService } from '../common/base/catalog-base.service';
import { CreateDreamEventDto } from './dto/create-dream-event.dto';
import { QueryDreamEventsDto } from './dto/query-dream-events.dto';
import { UpdateDreamEventDto } from './dto/update-dream-event.dto';
import { DreamEvent, DreamEventDocument } from './schemas/dream-event.schema';

@Injectable()
export class DreamEventService extends CatalogBaseService {
  protected readonly entityName = 'DreamEvent';
  protected readonly dreamIdPath = 'analysis.entities.events.eventId';

  constructor(
    @InjectModel(DreamEvent.name)
    protected readonly model: Model<DreamEventDocument>,
    @InjectModel(DreamSession.name)
    protected readonly sessionModel: Model<DreamSessionDocument>,
  ) {
    super();
  }

  async create(dto: CreateDreamEventDto): Promise<DreamEventDocument> {
    return new this.model({
      label: dto.label,
      description: dto.description,
      dreamSessionId: new Types.ObjectId(dto.dreamSessionId),
    }).save();
  }

  async update(
    id: string,
    dto: UpdateDreamEventDto,
  ): Promise<DreamEventDocument> {
    const update: Record<string, unknown> = {};
    if (dto.label !== undefined) update.label = dto.label;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.dreamSessionId !== undefined)
      update.dreamSessionId = new Types.ObjectId(dto.dreamSessionId);
    const doc = await this.model
      .findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException(`DreamEvent ${id} not found`);
    return doc;
  }

  protected buildFilter(query: QueryDreamEventsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    this.applyExactOrRegex(filter, 'label', query.labelExact, query.label);
    this.applyTextField(filter, 'description', query.description);
    if (query.dreamSessionId?.trim()) {
      filter.dreamSessionId = new Types.ObjectId(query.dreamSessionId);
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

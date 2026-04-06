import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DreamSession, DreamSessionDocument } from '../dream-session/schemas/dream-session.schema';
import { CatalogBaseService } from '../common/base/catalog-base.service';
import { CreateDreamObjectDto } from './dto/create-dream-object.dto';
import { QueryDreamObjectsDto } from './dto/query-dream-objects.dto';
import { UpdateDreamObjectDto } from './dto/update-dream-object.dto';
import { DreamObject, DreamObjectDocument } from './schemas/dream-object.schema';

@Injectable()
export class DreamObjectService extends CatalogBaseService {
  protected readonly entityName = 'DreamObject';
  protected readonly dreamIdPath = 'analysis.entities.objects.objectId';

  constructor(
    @InjectModel(DreamObject.name) protected readonly model: Model<DreamObjectDocument>,
    @InjectModel(DreamSession.name) protected readonly sessionModel: Model<DreamSessionDocument>,
  ) {
    super();
  }

  async create(dto: CreateDreamObjectDto): Promise<DreamObjectDocument> {
    return new this.model(dto).save();
  }

  async update(id: string, dto: UpdateDreamObjectDto): Promise<DreamObjectDocument> {
    const doc = await this.model
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException(`DreamObject ${id} not found`);
    return doc;
  }

  protected buildFilter(query: QueryDreamObjectsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    this.applyExactOrRegex(filter, 'name', query.nameExact, query.name);
    this.applyTextField(filter, 'description', query.description);
    this.applyImageFilter(filter, query.hasImage);
    this.applyDateRange(filter, 'createdAt', query.createdFrom, query.createdTo);
    this.applyDateRange(filter, 'updatedAt', query.updatedFrom, query.updatedTo);
    return filter;
  }
}

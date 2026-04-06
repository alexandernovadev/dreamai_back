import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CatalogBaseService } from '../common/base/catalog-base.service';
import { CreateContextLifeDto } from './dto/create-context-life.dto';
import { QueryContextLivesDto } from './dto/query-context-lives.dto';
import { UpdateContextLifeDto } from './dto/update-context-life.dto';
import {
  ContextLife,
  ContextLifeDocument,
} from './schemas/context-life.schema';

@Injectable()
export class ContextLifeService extends CatalogBaseService {
  protected readonly entityName = 'ContextLife';
  protected readonly dreamIdPath =
    'analysis.entities.contextLife.contextLifeId';

  constructor(
    @InjectModel(ContextLife.name)
    protected readonly model: Model<ContextLifeDocument>,
    @InjectModel(DreamSession.name)
    protected readonly sessionModel: Model<DreamSessionDocument>,
  ) {
    super();
  }

  async create(dto: CreateContextLifeDto): Promise<ContextLifeDocument> {
    return new this.model(dto).save();
  }

  async update(
    id: string,
    dto: UpdateContextLifeDto,
  ): Promise<ContextLifeDocument> {
    const doc = await this.model
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException(`ContextLife ${id} not found`);
    return doc;
  }

  protected buildFilter(query: QueryContextLivesDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    this.applyExactOrRegex(filter, 'title', query.titleExact, query.title);
    this.applyTextField(filter, 'description', query.description);
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

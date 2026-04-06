import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import { CatalogBaseService } from '../common/base/catalog-base.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location, LocationDocument } from './schemas/location.schema';

@Injectable()
export class LocationService extends CatalogBaseService {
  protected readonly entityName = 'Location';
  protected readonly dreamIdPath = 'analysis.entities.locations.locationId';

  constructor(
    @InjectModel(Location.name)
    protected readonly model: Model<LocationDocument>,
    @InjectModel(DreamSession.name)
    protected readonly sessionModel: Model<DreamSessionDocument>,
  ) {
    super();
  }

  async create(dto: CreateLocationDto): Promise<LocationDocument> {
    return new this.model(dto).save();
  }

  async update(id: string, dto: UpdateLocationDto): Promise<LocationDocument> {
    const doc = await this.model
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();
    if (!doc) throw new NotFoundException(`Location ${id} not found`);
    return doc;
  }

  protected buildFilter(query: QueryLocationsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    this.applyExactOrRegex(filter, 'name', query.nameExact, query.name);
    this.applyTextField(filter, 'description', query.description);
    if (query.isFamiliar !== undefined) filter.isFamiliar = query.isFamiliar;
    if (query.setting !== undefined) filter.setting = query.setting;
    this.applyImageFilter(filter, query.hasImage);
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

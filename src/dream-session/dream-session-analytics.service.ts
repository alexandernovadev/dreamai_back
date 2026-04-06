import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Character } from '../character/schemas/character.schema';
import { ContextLife } from '../context-life/schemas/context-life.schema';
import { DreamEvent } from '../dream-event/schemas/dream-event.schema';
import { DreamObject } from '../dream-object/schemas/dream-object.schema';
import { Feeling } from '../feeling/schemas/feeling.schema';
import { Location } from '../location/schemas/location.schema';
import {
  DreamSession,
  DreamSessionDocument,
} from './schemas/dream-session.schema';
import type {
  DreamAnalyticsOverviewDto,
  DreamAnalyticsTopEntityDto,
} from './dream-session-analytics.types';
import { refToIdHex } from '../common/utils/mongo';

const TOP_LIMIT = 10;

@Injectable()
export class DreamSessionAnalyticsService {
  constructor(
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
    @InjectModel(Character.name)
    private characterModel: Model<unknown>,
    @InjectModel(Location.name)
    private locationModel: Model<unknown>,
    @InjectModel(DreamObject.name)
    private dreamObjectModel: Model<unknown>,
    @InjectModel(DreamEvent.name)
    private dreamEventModel: Model<unknown>,
    @InjectModel(ContextLife.name)
    private contextLifeModel: Model<unknown>,
    @InjectModel(Feeling.name)
    private feelingModel: Model<unknown>,
  ) {}

  async getOverview(): Promise<DreamAnalyticsOverviewDto> {
    const [
      dreamCount,
      catalogTotals,
      lucidityHistogram,
      topCharacters,
      topLocations,
      topObjects,
    ] = await Promise.all([
      this.dreamSessionModel.countDocuments().exec(),
      this.catalogTotals(),
      this.lucidityHistogram(),
      this.topCharacters(),
      this.topLocations(),
      this.topObjects(),
    ]);

    return {
      dreamCount,
      catalogTotals,
      lucidityHistogram,
      topCharacters,
      topLocations,
      topObjects,
    };
  }

  private async catalogTotals(): Promise<DreamAnalyticsOverviewDto['catalogTotals']> {
    const [
      characters,
      locations,
      objects,
      events,
      contextLife,
      feelings,
    ] = await Promise.all([
      this.characterModel.countDocuments().exec(),
      this.locationModel.countDocuments().exec(),
      this.dreamObjectModel.countDocuments().exec(),
      this.dreamEventModel.countDocuments().exec(),
      this.contextLifeModel.countDocuments().exec(),
      this.feelingModel.countDocuments().exec(),
    ]);

    return {
      characters,
      locations,
      objects,
      events,
      contextLife,
      feelings,
    };
  }

  private async lucidityHistogram(): Promise<
    DreamAnalyticsOverviewDto['lucidityHistogram']
  > {
    const agg = await this.dreamSessionModel
      .aggregate<{ _id: number; count: number }>([
        {
          $match: {
            'analysis.lucidityLevel': {
              $exists: true,
              $type: 'number',
              $gte: 0,
              $lte: 10,
            },
          },
        },
        {
          $group: {
            _id: '$analysis.lucidityLevel',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    const byLevel = new Map<number, number>();
    for (const row of agg) {
      const lv = Math.min(10, Math.max(0, Math.round(Number(row._id))));
      byLevel.set(lv, (byLevel.get(lv) ?? 0) + row.count);
    }

    const out: DreamAnalyticsOverviewDto['lucidityHistogram'] = [];
    for (let level = 0; level <= 10; level += 1) {
      out.push({ level, count: byLevel.get(level) ?? 0 });
    }
    return out;
  }

  private async topCharacters(): Promise<DreamAnalyticsTopEntityDto[]> {
    const rows = await this.dreamSessionModel
      .aggregate<{ _id: unknown; count: number }>([
        {
          $unwind: {
            path: '$analysis.entities.characters',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: '$analysis.entities.characters.characterId',
            count: { $sum: 1 },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: TOP_LIMIT },
      ])
      .exec();

    return this.attachNames(
      rows,
      this.characterModel,
      'name',
    );
  }

  private async topLocations(): Promise<DreamAnalyticsTopEntityDto[]> {
    const rows = await this.dreamSessionModel
      .aggregate<{ _id: unknown; count: number }>([
        {
          $unwind: {
            path: '$analysis.entities.locations',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: '$analysis.entities.locations.locationId',
            count: { $sum: 1 },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: TOP_LIMIT },
      ])
      .exec();

    return this.attachNames(rows, this.locationModel, 'name');
  }

  private async topObjects(): Promise<DreamAnalyticsTopEntityDto[]> {
    const rows = await this.dreamSessionModel
      .aggregate<{ _id: unknown; count: number }>([
        {
          $unwind: {
            path: '$analysis.entities.objects',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: '$analysis.entities.objects.objectId',
            count: { $sum: 1 },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } },
        { $limit: TOP_LIMIT },
      ])
      .exec();

    return this.attachNames(rows, this.dreamObjectModel, 'name');
  }

  private async attachNames(
    rows: { _id: unknown; count: number }[],
    model: Model<unknown>,
    nameField: 'name' | 'title',
  ): Promise<DreamAnalyticsTopEntityDto[]> {
    const pairs: { id: string; count: number }[] = [];
    for (const r of rows) {
      const id = refToIdHex(r._id);
      if (!id) continue;
      pairs.push({ id, count: r.count });
    }
    if (pairs.length === 0) return [];

    const oids = pairs.map((p) => new Types.ObjectId(p.id));
    const docs = await model
      .find({ _id: { $in: oids } } as never)
      .select(`${nameField}`)
      .lean()
      .exec();

    const nameById = new Map<string, string>();
    for (const d of docs as Array<Record<string, unknown> & { _id: unknown }>) {
      const id = refToIdHex(d._id);
      if (!id) continue;
      const raw = d[nameField];
      const name =
        typeof raw === 'string' && raw.trim() !== ''
          ? raw.trim()
          : 'Sin nombre';
      nameById.set(id, name);
    }

    return pairs.map((p) => ({
      id: p.id,
      name: nameById.get(p.id) ?? '—',
      count: p.count,
    }));
  }
}

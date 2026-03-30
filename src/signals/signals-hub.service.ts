import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Character, CharacterDocument } from '../character/schemas/character.schema';
import { ContextLife, ContextLifeDocument } from '../context-life/schemas/context-life.schema';
import { DreamEvent, DreamEventDocument } from '../dream-event/schemas/dream-event.schema';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import {
  DreamObject,
  DreamObjectDocument,
} from '../dream-object/schemas/dream-object.schema';
import { Feeling, FeelingDocument } from '../feeling/schemas/feeling.schema';
import { Location, LocationDocument } from '../location/schemas/location.schema';

const HUB_LIMIT = 5;

/** Unified card row for the Signals hub (English UI titles). */
export type SignalsHubItemDto = {
  id: string;
  title: string;
  imageUri?: string;
  appearanceCount: number;
};

export type SignalsHubResponseDto = {
  characters: SignalsHubItemDto[];
  locations: SignalsHubItemDto[];
  objects: SignalsHubItemDto[];
  events: SignalsHubItemDto[];
  lifeContext: SignalsHubItemDto[];
  feelings: SignalsHubItemDto[];
};

/** Paths under `dream_sessions` for entity links (aligned with indexes). */
const ENTITY_PATHS = {
  characters: {
    unwind: 'analysis.entities.characters',
    idField: 'analysis.entities.characters.characterId',
  },
  locations: {
    unwind: 'analysis.entities.locations',
    idField: 'analysis.entities.locations.locationId',
  },
  objects: {
    unwind: 'analysis.entities.objects',
    idField: 'analysis.entities.objects.objectId',
  },
  events: {
    unwind: 'analysis.entities.events',
    idField: 'analysis.entities.events.eventId',
  },
  contextLife: {
    unwind: 'analysis.entities.contextLife',
    idField: 'analysis.entities.contextLife.contextLifeId',
  },
  feelings: {
    unwind: 'analysis.entities.feelings',
    idField: 'analysis.entities.feelings.feelingId',
  },
} as const;

type EntityPathKey = keyof typeof ENTITY_PATHS;

function feelingTitleEn(kind: string): string {
  return kind
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

@Injectable()
export class SignalsHubService {
  constructor(
    @InjectModel(Character.name)
    private characterModel: Model<CharacterDocument>,
    @InjectModel(Location.name)
    private locationModel: Model<LocationDocument>,
    @InjectModel(DreamObject.name)
    private dreamObjectModel: Model<DreamObjectDocument>,
    @InjectModel(DreamEvent.name)
    private dreamEventModel: Model<DreamEventDocument>,
    @InjectModel(ContextLife.name)
    private contextLifeModel: Model<ContextLifeDocument>,
    @InjectModel(Feeling.name)
    private feelingModel: Model<FeelingDocument>,
    @InjectModel(DreamSession.name)
    private dreamSessionModel: Model<DreamSessionDocument>,
  ) {}

  /**
   * One request: last `HUB_LIMIT` rows per catalog (by `updatedAt`) + session appearance
   * counts via a single aggregation per entity type (no N+1 `getOne` fan-out).
   */
  async getHub(): Promise<SignalsHubResponseDto> {
    const [
      characters,
      locations,
      objects,
      events,
      lifeContext,
      feelings,
    ] = await Promise.all([
      this.buildCharacters(),
      this.buildLocations(),
      this.buildObjects(),
      this.buildEvents(),
      this.buildLifeContext(),
      this.buildFeelings(),
    ]);

    return {
      characters,
      locations,
      objects,
      events,
      lifeContext,
      feelings,
    };
  }

  private async appearanceCounts(
    key: EntityPathKey,
    ids: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (ids.length === 0) {
      return new Map();
    }
    const { unwind, idField } = ENTITY_PATHS[key];
    const unwindRef = `$${unwind}`;
    const idRef = `$${idField}`;
    const pipeline: PipelineStage[] = [
      { $match: { [idField]: { $in: ids } } },
      { $unwind: unwindRef },
      { $match: { [idField]: { $in: ids } } },
      {
        $group: {
          _id: { e: idRef, s: '$_id' },
        },
      },
      {
        $group: {
          _id: '$_id.e',
          count: { $sum: 1 },
        },
      },
    ];

    const rows = await this.dreamSessionModel.aggregate(pipeline).exec();
    const map = new Map<string, number>();
    for (const r of rows) {
      const id = r._id as Types.ObjectId;
      map.set(id.toString(), r.count as number);
    }
    return map;
  }

  private async buildCharacters(): Promise<SignalsHubItemDto[]> {
    const rows = await this.characterModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(HUB_LIMIT)
      .lean()
      .exec();
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('characters', ids);
    return rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.name,
        imageUri: r.imageUri,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
  }

  private async buildLocations(): Promise<SignalsHubItemDto[]> {
    const rows = await this.locationModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(HUB_LIMIT)
      .lean()
      .exec();
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('locations', ids);
    return rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.name,
        imageUri: r.imageUri,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
  }

  private async buildObjects(): Promise<SignalsHubItemDto[]> {
    const rows = await this.dreamObjectModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(HUB_LIMIT)
      .lean()
      .exec();
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('objects', ids);
    return rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.name,
        imageUri: r.imageUri,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
  }

  private async buildEvents(): Promise<SignalsHubItemDto[]> {
    const rows = await this.dreamEventModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(HUB_LIMIT)
      .lean()
      .exec();
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('events', ids);
    return rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.label,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
  }

  private async buildLifeContext(): Promise<SignalsHubItemDto[]> {
    const rows = await this.contextLifeModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(HUB_LIMIT)
      .lean()
      .exec();
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('contextLife', ids);
    return rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.title,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
  }

  private async buildFeelings(): Promise<SignalsHubItemDto[]> {
    const rows = await this.feelingModel
      .find()
      .sort({ updatedAt: -1 })
      .limit(HUB_LIMIT)
      .lean()
      .exec();
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('feelings', ids);
    return rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      const kind = r.kind as string;
      return {
        id,
        title: feelingTitleEn(kind),
        appearanceCount: counts.get(id) ?? 0,
      };
    });
  }
}

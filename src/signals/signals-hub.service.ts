import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

export type SignalsCatalogPageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SignalsCatalogPageDto = {
  data: SignalsHubItemDto[];
  meta: SignalsCatalogPageMeta;
};

const CATALOG_MAX_LIMIT = 100;
const CATALOG_DEFAULT_LIMIT = 20;

/**
 * Same field paths as `*Service.findOne` dream filters (e.g. CharacterService).
 */
const DREAM_ENTITY_ID_FIELD = {
  characters: 'analysis.entities.characters.characterId',
  locations: 'analysis.entities.locations.locationId',
  objects: 'analysis.entities.objects.objectId',
  events: 'analysis.entities.events.eventId',
  contextLife: 'analysis.entities.contextLife.contextLifeId',
  feelings: 'analysis.entities.feelings.feelingId',
} as const;

type EntityPathKey = keyof typeof DREAM_ENTITY_ID_FIELD;

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
  /**
   * Paginated “See all” lists: one HTTP call from the app; counts use same rules as `getHub` / `findOne`.
   */
  async getCatalogPage(
    entity: string,
    pageRaw: number,
    limitRaw: number,
  ): Promise<SignalsCatalogPageDto> {
    const allowed = new Set([
      'characters',
      'locations',
      'objects',
      'events',
      'life-context',
      'feelings',
    ]);
    if (!allowed.has(entity)) {
      throw new BadRequestException(`Unknown catalog entity: ${entity}`);
    }

    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    const limit = Math.min(
      CATALOG_MAX_LIMIT,
      Math.max(
        1,
        Number.isFinite(limitRaw) && limitRaw >= 1
          ? Math.floor(limitRaw)
          : CATALOG_DEFAULT_LIMIT,
      ),
    );
    const skip = (page - 1) * limit;

    switch (entity) {
      case 'characters':
        return this.catalogCharactersPage(skip, limit, page);
      case 'locations':
        return this.catalogLocationsPage(skip, limit, page);
      case 'objects':
        return this.catalogObjectsPage(skip, limit, page);
      case 'events':
        return this.catalogEventsPage(skip, limit, page);
      case 'life-context':
        return this.catalogLifeContextPage(skip, limit, page);
      case 'feelings':
        return this.catalogFeelingsPage(skip, limit, page);
      default:
        throw new BadRequestException(`Unknown catalog entity: ${entity}`);
    }
  }

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

  /**
   * `countDocuments` on `dream_sessions` — same paths as catalog `findOne`.
   * `$or` ObjectId + hex string: refs may be stored as either BSON type after JSON PATCH.
   */
  private async appearanceCounts(
    key: EntityPathKey,
    ids: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (ids.length === 0) {
      return new Map();
    }
    const idField = DREAM_ENTITY_ID_FIELD[key];
    const entries = await Promise.all(
      ids.map(async (oid) => {
        const hex = oid.toString();
        const filter = {
          $or: [{ [idField]: oid }, { [idField]: hex }],
        };
        const count = await this.dreamSessionModel
          .countDocuments(filter as never)
          .exec();
        return [hex, count] as const;
      }),
    );
    return new Map(entries);
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

  private pageMeta(
    total: number,
    page: number,
    limit: number,
  ): SignalsCatalogPageMeta {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return { page, limit, total, totalPages };
  }

  private async catalogCharactersPage(
    skip: number,
    limit: number,
    page: number,
  ): Promise<SignalsCatalogPageDto> {
    const [rows, total] = await Promise.all([
      this.characterModel
        .find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.characterModel.countDocuments({}).exec(),
    ]);
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('characters', ids);
    const data = rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.name,
        imageUri: r.imageUri,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
    return { data, meta: this.pageMeta(total, page, limit) };
  }

  private async catalogLocationsPage(
    skip: number,
    limit: number,
    page: number,
  ): Promise<SignalsCatalogPageDto> {
    const [rows, total] = await Promise.all([
      this.locationModel
        .find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.locationModel.countDocuments({}).exec(),
    ]);
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('locations', ids);
    const data = rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.name,
        imageUri: r.imageUri,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
    return { data, meta: this.pageMeta(total, page, limit) };
  }

  private async catalogObjectsPage(
    skip: number,
    limit: number,
    page: number,
  ): Promise<SignalsCatalogPageDto> {
    const [rows, total] = await Promise.all([
      this.dreamObjectModel
        .find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.dreamObjectModel.countDocuments({}).exec(),
    ]);
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('objects', ids);
    const data = rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.name,
        imageUri: r.imageUri,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
    return { data, meta: this.pageMeta(total, page, limit) };
  }

  private async catalogEventsPage(
    skip: number,
    limit: number,
    page: number,
  ): Promise<SignalsCatalogPageDto> {
    const [rows, total] = await Promise.all([
      this.dreamEventModel
        .find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.dreamEventModel.countDocuments({}).exec(),
    ]);
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('events', ids);
    const data = rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.label,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
    return { data, meta: this.pageMeta(total, page, limit) };
  }

  private async catalogLifeContextPage(
    skip: number,
    limit: number,
    page: number,
  ): Promise<SignalsCatalogPageDto> {
    const [rows, total] = await Promise.all([
      this.contextLifeModel
        .find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.contextLifeModel.countDocuments({}).exec(),
    ]);
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('contextLife', ids);
    const data = rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: r.title,
        appearanceCount: counts.get(id) ?? 0,
      };
    });
    return { data, meta: this.pageMeta(total, page, limit) };
  }

  private async catalogFeelingsPage(
    skip: number,
    limit: number,
    page: number,
  ): Promise<SignalsCatalogPageDto> {
    const [rows, total] = await Promise.all([
      this.feelingModel
        .find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.feelingModel.countDocuments({}).exec(),
    ]);
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts('feelings', ids);
    const data = rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      const kind = r.kind as string;
      return {
        id,
        title: feelingTitleEn(kind),
        appearanceCount: counts.get(id) ?? 0,
      };
    });
    return { data, meta: this.pageMeta(total, page, limit) };
  }
}

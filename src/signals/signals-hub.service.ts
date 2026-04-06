import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from '../common/constants/pagination';
import {
  Character,
  CharacterDocument,
} from '../character/schemas/character.schema';
import {
  ContextLife,
  ContextLifeDocument,
} from '../context-life/schemas/context-life.schema';
import {
  DreamEvent,
  DreamEventDocument,
} from '../dream-event/schemas/dream-event.schema';
import {
  DreamSession,
  DreamSessionDocument,
} from '../dream-session/schemas/dream-session.schema';
import {
  DreamObject,
  DreamObjectDocument,
} from '../dream-object/schemas/dream-object.schema';
import { Feeling, FeelingDocument } from '../feeling/schemas/feeling.schema';
import {
  Location,
  LocationDocument,
} from '../location/schemas/location.schema';

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
type LeanRow = Record<string, unknown>;
type TitleFn = (row: LeanRow) => string;
type ImageUriFn = (row: LeanRow) => string | undefined;

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
    const withImage: ImageUriFn = (r) => r.imageUri as string | undefined;

    const [characters, locations, objects, events, lifeContext, feelings] =
      await Promise.all([
        this.buildHubItems(
          this.characterModel,
          'characters',
          (r) => String(r.name),
          withImage,
        ),
        this.buildHubItems(
          this.locationModel,
          'locations',
          (r) => String(r.name),
          withImage,
        ),
        this.buildHubItems(
          this.dreamObjectModel,
          'objects',
          (r) => String(r.name),
          withImage,
        ),
        this.buildHubItems(this.dreamEventModel, 'events', (r) =>
          String(r.label),
        ),
        this.buildHubItems(this.contextLifeModel, 'contextLife', (r) =>
          String(r.title),
        ),
        this.buildHubItems(this.feelingModel, 'feelings', (r) =>
          feelingTitleEn(String(r.kind)),
        ),
      ]);

    return { characters, locations, objects, events, lifeContext, feelings };
  }

  /**
   * Paginated "See all" lists: one HTTP call from the app; counts use same rules as `getHub` / `findOne`.
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

    const page =
      Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        Number.isFinite(limitRaw) && limitRaw >= 1
          ? Math.floor(limitRaw)
          : DEFAULT_LIMIT,
      ),
    );
    const skip = (page - 1) * limit;
    const withImage: ImageUriFn = (r) => r.imageUri as string | undefined;

    switch (entity) {
      case 'characters':
        return this.buildCatalogPage(
          this.characterModel,
          'characters',
          skip,
          limit,
          page,
          (r) => String(r.name),
          withImage,
        );
      case 'locations':
        return this.buildCatalogPage(
          this.locationModel,
          'locations',
          skip,
          limit,
          page,
          (r) => String(r.name),
          withImage,
        );
      case 'objects':
        return this.buildCatalogPage(
          this.dreamObjectModel,
          'objects',
          skip,
          limit,
          page,
          (r) => String(r.name),
          withImage,
        );
      case 'events':
        return this.buildCatalogPage(
          this.dreamEventModel,
          'events',
          skip,
          limit,
          page,
          (r) => String(r.label),
        );
      case 'life-context':
        return this.buildCatalogPage(
          this.contextLifeModel,
          'contextLife',
          skip,
          limit,
          page,
          (r) => String(r.title),
        );
      case 'feelings':
        return this.buildCatalogPage(
          this.feelingModel,
          'feelings',
          skip,
          limit,
          page,
          (r) => feelingTitleEn(String(r.kind)),
        );
      default:
        throw new BadRequestException(`Unknown catalog entity: ${entity}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Generic helpers — replace 12 near-identical private methods
  // ---------------------------------------------------------------------------

  private async buildHubItems(
    model: Model<any>,
    key: EntityPathKey,
    getTitle: TitleFn,
    getImageUri?: ImageUriFn,
  ): Promise<SignalsHubItemDto[]> {
    const rows = (await model
      .find()
      .sort({ updatedAt: -1 })
      .limit(HUB_LIMIT)
      .lean()
      .exec()) as LeanRow[];
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts(key, ids);
    return rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: getTitle(r),
        imageUri: getImageUri?.(r),
        appearanceCount: counts.get(id) ?? 0,
      };
    });
  }

  private async buildCatalogPage(
    model: Model<any>,
    key: EntityPathKey,
    skip: number,
    limit: number,
    page: number,
    getTitle: TitleFn,
    getImageUri?: ImageUriFn,
  ): Promise<SignalsCatalogPageDto> {
    const [rows, total] = await Promise.all([
      model
        .find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as Promise<LeanRow[]>,
      model.countDocuments({}).exec(),
    ]);
    const ids = rows.map((r) => r._id as Types.ObjectId);
    const counts = await this.appearanceCounts(key, ids);
    const data = rows.map((r) => {
      const id = (r._id as Types.ObjectId).toString();
      return {
        id,
        title: getTitle(r),
        imageUri: getImageUri?.(r),
        appearanceCount: counts.get(id) ?? 0,
      };
    });
    return { data, meta: this.pageMeta(total, page, limit) };
  }

  /**
   * `countDocuments` on `dream_sessions` — same paths as catalog `findOne`.
   * `$or` ObjectId + hex string: refs may be stored as either BSON type after JSON PATCH.
   */
  private async appearanceCounts(
    key: EntityPathKey,
    ids: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();
    const idField = DREAM_ENTITY_ID_FIELD[key];
    const entries = await Promise.all(
      ids.map(async (oid) => {
        const hex = oid.toString();
        const filter = { $or: [{ [idField]: oid }, { [idField]: hex }] };
        const count = await this.dreamSessionModel
          .countDocuments(filter as never)
          .exec();
        return [hex, count] as const;
      }),
    );
    return new Map(entries);
  }

  private pageMeta(
    total: number,
    page: number,
    limit: number,
  ): SignalsCatalogPageMeta {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return { page, limit, total, totalPages };
  }
}

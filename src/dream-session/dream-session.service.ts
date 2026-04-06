import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Character } from '../character/schemas/character.schema';
import { ContextLife } from '../context-life/schemas/context-life.schema';
import { DreamEvent } from '../dream-event/schemas/dream-event.schema';
import { DreamObject } from '../dream-object/schemas/dream-object.schema';
import { Feeling } from '../feeling/schemas/feeling.schema';
import { Location } from '../location/schemas/location.schema';
import { escapeRegex } from '../common/utils/escape-regex';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../common/constants/pagination';
import { MAX_DREAMS_FOR_RANGE_SUMMARY } from '../common/constants/ai';
import { CreateDreamSessionDto } from './dto/create-dream-session.dto';
import { DreamEntitiesInputDto } from './dto/dream-entities-input.dto';
import { QueryDreamSessionsDto } from './dto/query-dream-sessions.dto';
import { UpdateDreamSessionDto } from './dto/update-dream-session.dto';
import {
  DreamSession,
  DreamSessionDocument,
  DreamSessionStatus,
} from './schemas/dream-session.schema';
import type { HydratedDreamSessionPayload } from './dream-session-hydrated.types';
import { maxDreamSessionStatus } from './dream-session-status.util';


function uniqValidObjectIds(ids: unknown[]): string[] {
  const set = new Set<string>();
  for (const x of ids) {
    const s = typeof x === 'string' ? x : x != null ? String(x) : null;
    if (s && Types.ObjectId.isValid(s)) set.add(s);
  }
  return [...set];
}

function idStr(v: unknown): string {
  if (
    v != null &&
    typeof (v as { toString?: () => string }).toString === 'function'
  ) {
    return String((v as { toString: () => string }).toString());
  }
  return String(v);
}

function mapById<T>(
  docs: Array<Record<string, unknown>>,
  pair: (d: Record<string, unknown>) => [string, T],
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const d of docs) {
    const [k, v] = pair(d);
    out[k] = v;
  }
  return out;
}

@Injectable()
export class DreamSessionService {
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

  async create(dto: CreateDreamSessionDto): Promise<DreamSessionDocument> {
    if (dto.analysis?.entities) {
      await this.validateEntities(dto.analysis.entities);
    }
    const payload: Record<string, unknown> = {
      ...dto,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : undefined,
    };
    const doc = new this.dreamSessionModel(payload);
    return doc.save();
  }

  async findAll(query: QueryDreamSessionsDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const rawLimit = query.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.dreamSessionModel
        .find(filter as never)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.dreamSessionModel.countDocuments(filter as never).exec(),
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
   * IDs de sueños cuyo `timestamp` cae en [start, end] (inclusive), más recientes primero.
   * `total` = coincidencias en BD; la lista devuelta está acotada a `maxDocs`.
   */
  async findIdsInTimestampRange(
    start: Date,
    end: Date,
    maxDocs: number,
  ): Promise<{ ids: string[]; total: number; truncated: boolean }> {
    const filter = { timestamp: { $gte: start, $lte: end } };
    const total = await this.dreamSessionModel.countDocuments(filter).exec();
    const cap = Math.min(Math.max(1, maxDocs), MAX_DREAMS_FOR_RANGE_SUMMARY);
    const docs = await this.dreamSessionModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(cap)
      .select('_id')
      .lean()
      .exec();
    const ids = docs.map((d) => idStr((d as { _id: unknown })._id));
    const truncated = total > ids.length;
    return { ids, total, truncated };
  }

  /**
   * Los N sueños con `timestamp` más reciente (orden por fecha del sueño, no por `createdAt`).
   */
  async findRecentIdsByDreamTimestamp(
    limit: number,
  ): Promise<{ ids: string[]; count: number }> {
    const cap = Math.min(Math.max(1, limit), MAX_LIMIT);
    const docs = await this.dreamSessionModel
      .find({
        timestamp: { $exists: true, $ne: null },
      })
      .sort({ timestamp: -1 })
      .limit(cap)
      .select('_id')
      .lean()
      .exec();
    const ids = docs.map((d) => idStr((d as { _id: unknown })._id));
    return { ids, count: ids.length };
  }

  async findOne(id: string): Promise<DreamSessionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    const doc = await this.dreamSessionModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    return doc;
  }

  /**
   * Sesión + mapas de catálogo por id (batch `$in`), sin N+1 desde el cliente.
   */
  async findOneHydrated(id: string): Promise<HydratedDreamSessionPayload> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    const session = await this.dreamSessionModel.findById(id).lean().exec();
    if (!session) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }

    const emptyHydrated = (): HydratedDreamSessionPayload['hydrated'] => ({
      characters: {},
      locations: {},
      objects: {},
      contextLife: {},
      events: {},
      feelings: {},
    });

    const entities = session.analysis?.entities;
    if (!entities) {
      return { session, hydrated: emptyHydrated() };
    }

    const charIds = uniqValidObjectIds(
      (entities.characters ?? []).map((r) => r.characterId),
    );
    const locIds = uniqValidObjectIds(
      (entities.locations ?? []).map((r) => r.locationId),
    );
    const objIds = uniqValidObjectIds(
      (entities.objects ?? []).map((r) => r.objectId),
    );
    const ctxIds = uniqValidObjectIds(
      (entities.contextLife ?? []).map((r) => r.contextLifeId),
    );
    const evIds = uniqValidObjectIds(
      (entities.events ?? []).map((r) => r.eventId),
    );
    const feelIds = uniqValidObjectIds(
      (entities.feelings ?? []).map((r) => r.feelingId),
    );

    const [charDocs, locDocs, objDocs, ctxDocs, evDocs, feelDocs] =
      await Promise.all([
        this.findLeanByIds(
          this.characterModel,
          charIds,
          '_id name description',
        ),
        this.findLeanByIds(this.locationModel, locIds, '_id name description'),
        this.findLeanByIds(
          this.dreamObjectModel,
          objIds,
          '_id name description',
        ),
        this.findLeanByIds(
          this.contextLifeModel,
          ctxIds,
          '_id title description',
        ),
        this.findLeanByIds(
          this.dreamEventModel,
          evIds,
          '_id label description',
        ),
        this.findLeanByIds(
          this.feelingModel,
          feelIds,
          '_id kind intensity notes',
        ),
      ]);

    const characters = mapById(charDocs, (d) => {
      const oid = idStr(d._id);
      const row: {
        id: string;
        name: string;
        description?: string;
      } = { id: oid, name: String(d.name) };
      const desc = d.description;
      if (desc !== undefined && desc !== null && String(desc).trim() !== '') {
        row.description = String(desc).slice(0, 5000);
      }
      return [oid, row];
    });
    const locations = mapById(locDocs, (d) => {
      const oid = idStr(d._id);
      const row: {
        id: string;
        name: string;
        description?: string;
      } = { id: oid, name: String(d.name) };
      const desc = d.description;
      if (desc !== undefined && desc !== null && String(desc).trim() !== '') {
        row.description = String(desc).slice(0, 5000);
      }
      return [oid, row];
    });
    const objects = mapById(objDocs, (d) => {
      const oid = idStr(d._id);
      const row: {
        id: string;
        name: string;
        description?: string;
      } = { id: oid, name: String(d.name) };
      const desc = d.description;
      if (desc !== undefined && desc !== null && String(desc).trim() !== '') {
        row.description = String(desc).slice(0, 5000);
      }
      return [oid, row];
    });
    const contextLife = mapById(ctxDocs, (d) => {
      const oid = idStr(d._id);
      const title = String(d.title);
      const row: { id: string; title: string; description?: string } = {
        id: oid,
        title,
      };
      const desc = d.description;
      if (desc !== undefined && desc !== null && String(desc).trim() !== '') {
        row.description = String(desc).slice(0, 5000);
      }
      return [oid, row];
    });
    const events = mapById(evDocs, (d) => {
      const oid = idStr(d._id);
      const row: {
        id: string;
        label: string;
        description?: string;
      } = { id: oid, label: String(d.label) };
      const desc = d.description;
      if (desc !== undefined && desc !== null && String(desc).trim() !== '') {
        row.description = String(desc).slice(0, 5000);
      }
      return [oid, row];
    });
    const feelings = mapById(feelDocs, (d) => {
      const oid = idStr(d._id);
      return [
        oid,
        {
          id: oid,
          kind: String(d.kind),
          intensity:
            d.intensity === undefined || d.intensity === null
              ? undefined
              : Number(d.intensity),
          notes:
            d.notes === undefined || d.notes === null
              ? undefined
              : String(d.notes),
        },
      ];
    });

    return {
      session,
      hydrated: {
        characters,
        locations,
        objects,
        contextLife,
        events,
        feelings,
      },
    };
  }

  private async findLeanByIds(
    model: Model<unknown>,
    ids: string[],
    select: string,
  ): Promise<Array<Record<string, unknown>>> {
    if (ids.length === 0) return [];
    const oids = ids.map((i) => new Types.ObjectId(i));
    return model
      .find({ _id: { $in: oids } } as never)
      .select(select)
      .lean()
      .exec() as Promise<Array<Record<string, unknown>>>;
  }

  async update(
    id: string,
    dto: UpdateDreamSessionDto,
  ): Promise<DreamSessionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    const existing = await this.dreamSessionModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    if (dto.analysis?.entities) {
      await this.validateEntities(dto.analysis.entities);
    }
    const update: Record<string, unknown> = { ...dto };
    if (dto.timestamp !== undefined) {
      update.timestamp = dto.timestamp ? new Date(dto.timestamp) : null;
    }
    // Ver `maxDreamSessionStatus`: no rebajar fase al editar un paso ya superado.
    if (dto.status !== undefined) {
      update.status = maxDreamSessionStatus(
        existing.status as DreamSessionStatus,
        dto.status,
      );
    }
    const doc = await this.dreamSessionModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    return doc;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
    const res = await this.dreamSessionModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`DreamSession ${id} not found`);
    }
  }

  /**
   * Validates that every ObjectId in `entities` actually exists in its collection.
   * Runs all checks in parallel; throws 400 listing every missing id.
   */
  private async validateEntities(
    entities: DreamEntitiesInputDto,
  ): Promise<void> {
    const checks: Array<Promise<string | null>> = [];

    const assertExists = (
      model: Model<unknown>,
      id: string,
      label: string,
    ): Promise<string | null> =>
      model
        .exists({ _id: new Types.ObjectId(id) })
        .exec()
        .then((found) => (found ? null : `${label} ${id} not found`));

    for (const r of entities.characters ?? []) {
      checks.push(
        assertExists(this.characterModel, r.characterId, 'Character'),
      );
    }
    for (const r of entities.locations ?? []) {
      checks.push(assertExists(this.locationModel, r.locationId, 'Location'));
    }
    for (const r of entities.objects ?? []) {
      checks.push(
        assertExists(this.dreamObjectModel, r.objectId, 'DreamObject'),
      );
    }
    for (const r of entities.events ?? []) {
      checks.push(assertExists(this.dreamEventModel, r.eventId, 'DreamEvent'));
    }
    for (const r of entities.contextLife ?? []) {
      checks.push(
        assertExists(this.contextLifeModel, r.contextLifeId, 'ContextLife'),
      );
    }
    for (const r of entities.feelings ?? []) {
      checks.push(assertExists(this.feelingModel, r.feelingId, 'Feeling'));
    }

    if (checks.length === 0) return;

    const results = await Promise.all(checks);
    const missing = results.filter(Boolean) as string[];

    if (missing.length > 0) {
      throw new BadRequestException(missing);
    }
  }

  private buildFilter(query: QueryDreamSessionsDto): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.status !== undefined) {
      filter.status = query.status;
    }

    if (query.rawNarrative !== undefined && query.rawNarrative.trim() !== '') {
      filter.rawNarrative = {
        $regex: escapeRegex(query.rawNarrative.trim()),
        $options: 'i',
      };
    }

    if (query.dreamKind !== undefined && query.dreamKind.trim() !== '') {
      filter.dreamKind = query.dreamKind.trim();
    }

    if (query.timestampFrom || query.timestampTo) {
      const range: Record<string, Date> = {};
      if (query.timestampFrom) {
        range.$gte = new Date(query.timestampFrom);
      }
      if (query.timestampTo) {
        range.$lte = new Date(query.timestampTo);
      }
      filter.timestamp = range;
    }

    if (query.createdFrom || query.createdTo) {
      const range: Record<string, Date> = {};
      if (query.createdFrom) {
        range.$gte = new Date(query.createdFrom);
      }
      if (query.createdTo) {
        range.$lte = new Date(query.createdTo);
      }
      filter.createdAt = range;
    }

    return filter;
  }
}

import { NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { DreamSessionDocument } from '../../dream-session/schemas/dream-session.schema';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../constants/pagination';
import { escapeRegex } from '../utils/escape-regex';

/**
 * Base class for the 6 catalog entity services (Character, Location, DreamObject,
 * DreamEvent, Feeling, ContextLife). Provides shared `findAll`, `findOne`, `remove`
 * and filter-builder helpers. Subclasses provide the model, entity name, dream id path,
 * and their entity-specific `buildFilter`.
 *
 * **Why `Model<any>`**: filter objects use dynamic Mongoose operators ($regex, $or, ranges)
 * that don't satisfy the strict generic signature — `as never` is the standard workaround.
 */
export abstract class CatalogBaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract readonly model: Model<any>;
  protected abstract readonly sessionModel: Model<DreamSessionDocument>;
  /** Used in NotFoundException messages, e.g. "Character". */
  protected abstract readonly entityName: string;
  /** MongoDB path inside dream_sessions, e.g. "analysis.entities.characters.characterId". */
  protected abstract readonly dreamIdPath: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected abstract buildFilter(query: any): Record<string, unknown>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async findAll(query: any) {
    const page = (query.page as number | undefined) ?? DEFAULT_PAGE;
    const rawLimit = (query.limit as number | undefined) ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
    const filter = this.buildFilter(query);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filter as never).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.model.countDocuments(filter as never).exec(),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return { data, meta: { page, limit, total, totalPages } };
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException(`${this.entityName} ${id} not found`);

    const oid = new Types.ObjectId(id);
    const dreamFilter = {
      $or: [{ [this.dreamIdPath]: oid }, { [this.dreamIdPath]: oid.toString() }],
    };

    const [dreams, count] = await Promise.all([
      this.sessionModel
        .find(dreamFilter as never)
        .select({ _id: 1, timestamp: 1 })
        .sort({ timestamp: -1 })
        .lean()
        .exec(),
      this.sessionModel.countDocuments(dreamFilter as never).exec(),
    ]);

    return {
      ...doc.toObject(),
      dreamAppearances: {
        count,
        dreams: dreams.map((d) => ({ _id: d._id.toString(), timestamp: d.timestamp ?? null })),
      },
    };
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException(`${this.entityName} ${id} not found`);
  }

  // ---------------------------------------------------------------------------
  // Filter helpers — called by subclass buildFilter implementations
  // ---------------------------------------------------------------------------

  /** Exact match wins; falls back to case-insensitive regex partial match. */
  protected applyExactOrRegex(
    filter: Record<string, unknown>,
    field: string,
    exact?: string,
    partial?: string,
  ): void {
    if (exact?.trim()) {
      filter[field] = exact.trim();
    } else if (partial?.trim()) {
      filter[field] = { $regex: escapeRegex(partial.trim()), $options: 'i' };
    }
  }

  /** Case-insensitive partial match on a text field. */
  protected applyTextField(filter: Record<string, unknown>, field: string, value?: string): void {
    if (value?.trim()) {
      filter[field] = { $regex: escapeRegex(value.trim()), $options: 'i' };
    }
  }

  /** Filters by presence/absence of a non-empty `imageUri` field. */
  protected applyImageFilter(filter: Record<string, unknown>, hasImage?: boolean): void {
    if (hasImage === true) {
      filter.imageUri = { $exists: true, $nin: [null, ''] };
    } else if (hasImage === false) {
      filter.$or = [{ imageUri: { $exists: false } }, { imageUri: null }, { imageUri: '' }];
    }
  }

  /** Adds a $gte/$lte date range on the given field. */
  protected applyDateRange(
    filter: Record<string, unknown>,
    field: string,
    from?: string,
    to?: string,
  ): void {
    if (from !== undefined || to !== undefined) {
      const range: { $gte?: Date; $lte?: Date } = {};
      if (from !== undefined) range.$gte = new Date(from);
      if (to !== undefined) range.$lte = new Date(to);
      filter[field] = range;
    }
  }
}

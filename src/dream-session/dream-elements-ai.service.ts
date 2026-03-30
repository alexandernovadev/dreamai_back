import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiSuggestionsService } from '../ai/ai-suggestions.service';
import { escapeRegex } from '../common/utils/escape-regex';
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
  DreamObject,
  DreamObjectDocument,
} from '../dream-object/schemas/dream-object.schema';
import {
  Location,
  LocationDocument,
} from '../location/schemas/location.schema';
import type {
  DreamElementRow,
  DreamElementsSuggestResponse,
  MatchedCatalogRef,
} from './dream-elements-suggest.types';
import { DreamSessionService } from './dream-session.service';

/** Umbral mínimo de `confidence` del modelo para marcar `emphasizeNew` sin match. */
const EMPHASIZE_NEW_MIN_CONFIDENCE = 0.85;

@Injectable()
export class DreamElementsAiService {
  constructor(
    private readonly dreamSessionService: DreamSessionService,
    private readonly aiSuggestions: AiSuggestionsService,
    @InjectModel(Character.name)
    private readonly characterModel: Model<CharacterDocument>,
    @InjectModel(Location.name)
    private readonly locationModel: Model<LocationDocument>,
    @InjectModel(DreamObject.name)
    private readonly dreamObjectModel: Model<DreamObjectDocument>,
    @InjectModel(ContextLife.name)
    private readonly contextLifeModel: Model<ContextLifeDocument>,
    @InjectModel(DreamEvent.name)
    private readonly dreamEventModel: Model<DreamEventDocument>,
  ) {}

  /**
   * Lee `rawNarrative` de la sesión, llama al modelo y empareja nombres/títulos con el catálogo.
   * No escribe en DB; no modifica `analysis.entities` ya persistidos.
   */
  async suggestForSession(
    sessionId: string,
    locale?: string,
  ): Promise<DreamElementsSuggestResponse> {
    const session = await this.dreamSessionService.findOne(sessionId);
    const text = session.rawNarrative?.trim() ?? '';
    if (!text) {
      throw new BadRequestException(
        'La sesión no tiene narrativa (`rawNarrative`) para analizar.',
      );
    }

    const raw = await this.aiSuggestions.suggestDreamElements(text, locale);
    const sessionOid = new Types.ObjectId(sessionId);

    const [
      characters,
      locations,
      objects,
      contextLife,
      events,
    ] = await Promise.all([
      Promise.all(
        raw.characters.map((c) =>
          this.row(c, () => this.matchCharacter(c.name)),
        ),
      ),
      Promise.all(
        raw.locations.map((loc) =>
          this.row(loc, () => this.matchLocation(loc.name)),
        ),
      ),
      Promise.all(
        raw.objects.map((o) => this.row(o, () => this.matchObject(o.name))),
      ),
      Promise.all(
        raw.contextLife.map((cl) =>
          this.row(cl, () => this.matchContextLife(cl.title)),
        ),
      ),
      Promise.all(
        raw.events.map((ev) =>
          this.row(ev, () => this.matchDreamEvent(sessionOid, ev.label)),
        ),
      ),
    ]);

    return {
      schemaVersion: 1,
      dreamSessionId: sessionId,
      characters,
      locations,
      objects,
      contextLife,
      events,
    };
  }

  private async row<T extends { confidence?: number }>(
    fromAi: T,
    matchFn: () => Promise<MatchedCatalogRef | null>,
  ): Promise<DreamElementRow<T>> {
    const match = await matchFn();
    return {
      fromAi,
      match,
      emphasizeNew: this.shouldEmphasizeNew(fromAi.confidence, match),
    };
  }

  private shouldEmphasizeNew(
    confidence: number | undefined,
    match: MatchedCatalogRef | null,
  ): boolean {
    if (match !== null) return false;
    if (confidence === undefined) return false;
    return confidence >= EMPHASIZE_NEW_MIN_CONFIDENCE;
  }

  private async matchCharacter(name: string): Promise<MatchedCatalogRef | null> {
    const doc = await this.findOneByExactField(
      this.characterModel,
      'name',
      name,
    );
    if (!doc) return null;
    return {
      catalogId: doc._id.toString(),
      canonicalLabel: doc.name,
    };
  }

  private async matchLocation(name: string): Promise<MatchedCatalogRef | null> {
    const doc = await this.findOneByExactField(
      this.locationModel,
      'name',
      name,
    );
    if (!doc) return null;
    return {
      catalogId: doc._id.toString(),
      canonicalLabel: doc.name,
    };
  }

  private async matchObject(name: string): Promise<MatchedCatalogRef | null> {
    const doc = await this.findOneByExactField(
      this.dreamObjectModel,
      'name',
      name,
    );
    if (!doc) return null;
    return {
      catalogId: doc._id.toString(),
      canonicalLabel: doc.name,
    };
  }

  private async matchContextLife(
    title: string,
  ): Promise<MatchedCatalogRef | null> {
    const doc = await this.findOneByExactField(
      this.contextLifeModel,
      'title',
      title,
    );
    if (!doc) return null;
    return {
      catalogId: doc._id.toString(),
      canonicalLabel: doc.title,
    };
  }

  private async matchDreamEvent(
    dreamSessionId: Types.ObjectId,
    label: string,
  ): Promise<MatchedCatalogRef | null> {
    const trimmed = label.trim();
    if (!trimmed) return null;
    const doc = await this.dreamEventModel
      .findOne({
        dreamSessionId,
        label: {
          $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i'),
        },
      } as never)
      .lean()
      .exec();
    if (!doc) return null;
    return {
      catalogId: doc._id.toString(),
      canonicalLabel: doc.label,
    };
  }

  private async findOneByExactField<D extends { _id: Types.ObjectId }>(
    model: Model<D>,
    field: keyof D & string,
    value: string,
  ): Promise<D | null> {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return model
      .findOne({
        [field]: {
          $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i'),
        },
      } as never)
      .lean()
      .exec() as Promise<D | null>;
  }
}

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Archetype,
  DreamKind,
  DreamSessionStatus,
  LocationSetting,
} from '../domain/enums';
import { CatalogCharacter } from '../schemas/catalog-character.schema';
import type { CatalogCharacterDocument } from '../schemas/catalog-character.schema';
import { CatalogDreamObject } from '../schemas/catalog-object.schema';
import type { CatalogDreamObjectDocument } from '../schemas/catalog-object.schema';
import { CatalogLocation } from '../schemas/catalog-location.schema';
import type { CatalogLocationDocument } from '../schemas/catalog-location.schema';
import { LifeEvent } from '../schemas/life-event.schema';
import type { LifeEventDocument } from '../schemas/life-event.schema';
import { extractCatalogIdsFromDreamsJson } from './dream-session-catalog.util';

const PERSPECTIVE = new Set(['ACTOR', 'OBSERVER']);

/** Grado de lucidez por segmento: 0 = no lúcido, 1–5 = escala creciente. */
const LUCIDITY_MIN = 0;
const LUCIDITY_MAX = 5;

function isValidLucidityLevel(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= LUCIDITY_MIN &&
    value <= LUCIDITY_MAX
  );
}

const FEELING_KINDS = new Set([
  'FEAR',
  'ANXIETY',
  'JOY',
  'PEACE',
  'SADNESS',
  'ANGER',
  'SHAME',
  'GUILT',
  'CONFUSION',
  'LONGING',
  'AWE',
  'DISGUST',
  'NEUTRAL',
  'MIXED',
  'UNKNOWN',
]);

const ARCHETYPES = new Set<string>(Object.values(Archetype));
const LOCATION_SETTINGS = new Set<string>(Object.values(LocationSetting));

export interface DreamSessionValidateInput {
  status: DreamSessionStatus;
  dreamKind: DreamKind;
  userThought?: string | null;
  relatedLifeEventIds: string[];
  dreams: unknown[];
}

@Injectable()
export class DreamSessionValidationService {
  constructor(
    @InjectModel(CatalogCharacter.name)
    private readonly catalogCharacterModel: Model<CatalogCharacterDocument>,
    @InjectModel(CatalogLocation.name)
    private readonly catalogLocationModel: Model<CatalogLocationDocument>,
    @InjectModel(CatalogDreamObject.name)
    private readonly catalogDreamObjectModel: Model<CatalogDreamObjectDocument>,
    @InjectModel(LifeEvent.name)
    private readonly lifeEventModel: Model<LifeEventDocument>,
  ) {}

  async assertValid(input: DreamSessionValidateInput): Promise<void> {
    this.validateStatusAndKind(input);
    this.validateReflectionsDone(input);
    this.validateDreamsShape(input);
    const derived = extractCatalogIdsFromDreamsJson(input.dreams);
    await this.assertCatalogReferences(derived);
    await this.assertLifeEventsExist(input.relatedLifeEventIds);
  }

  private validateStatusAndKind(input: DreamSessionValidateInput): void {
    const { status, dreamKind } = input;
    if (
      status === DreamSessionStatus.DRAFT ||
      status === DreamSessionStatus.REFINING
    ) {
      if (dreamKind !== DreamKind.UNKNOWN) {
        throw new UnprocessableEntityException(
          'En DRAFT y REFINING dreamKind debe ser UNKNOWN (docs/dream-workflow-sequence.md).',
        );
      }
    }
    if (
      status === DreamSessionStatus.STRUCTURED ||
      status === DreamSessionStatus.REFLECTIONS_DONE
    ) {
      if (dreamKind === DreamKind.UNKNOWN) {
        throw new UnprocessableEntityException(
          'En STRUCTURED y REFLECTIONS_DONE dreamKind no puede ser UNKNOWN: confirma la clasificación.',
        );
      }
    }
  }

  private validateReflectionsDone(input: DreamSessionValidateInput): void {
    if (input.status !== DreamSessionStatus.REFLECTIONS_DONE) {
      return;
    }
    const t = input.userThought?.trim();
    if (!t) {
      throw new UnprocessableEntityException(
        'En REFLECTIONS_DONE se requiere userThought no vacío.',
      );
    }
  }

  private validateDreamsShape(input: DreamSessionValidateInput): void {
    const { dreams, status } = input;
    if (!Array.isArray(dreams)) {
      throw new UnprocessableEntityException('dreams debe ser un array JSON.');
    }

    const needFullModel =
      status === DreamSessionStatus.STRUCTURED ||
      status === DreamSessionStatus.REFLECTIONS_DONE;

    if (needFullModel && dreams.length === 0) {
      throw new UnprocessableEntityException(
        'En STRUCTURED o REFLECTIONS_DONE debe haber al menos un segmento en dreams.',
      );
    }

    dreams.forEach((seg, i) => {
      this.validateSegment(seg, i, needFullModel);
    });
  }

  private validateSegment(
    seg: unknown,
    index: number,
    requireAnalysis: boolean,
  ): void {
    const path = `dreams[${index}]`;
    if (!seg || typeof seg !== 'object' || Array.isArray(seg)) {
      throw new UnprocessableEntityException(`${path} debe ser un objeto.`);
    }
    const s = seg as Record<string, unknown>;
    if (typeof s.id !== 'string' || s.id.length === 0) {
      throw new UnprocessableEntityException(`${path}.id es obligatorio.`);
    }
    if (typeof s.order !== 'number' || !Number.isFinite(s.order)) {
      throw new UnprocessableEntityException(
        `${path}.order debe ser un número.`,
      );
    }
    if (typeof s.rawText !== 'string') {
      throw new UnprocessableEntityException(
        `${path}.rawText debe ser string.`,
      );
    }

    if (s.analysis === undefined || s.analysis === null) {
      if (requireAnalysis) {
        throw new UnprocessableEntityException(
          `${path}.analysis es obligatorio en STRUCTURED / REFLECTIONS_DONE.`,
        );
      }
      return;
    }
    if (!requireAnalysis) {
      return;
    }
    this.validateAnalysis(s.analysis, `${path}.analysis`);
  }

  private validateAnalysis(analysis: unknown, path: string): void {
    if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) {
      throw new UnprocessableEntityException(`${path} debe ser un objeto.`);
    }
    const a = analysis as Record<string, unknown>;
    if (typeof a.perspective !== 'string' || !PERSPECTIVE.has(a.perspective)) {
      throw new UnprocessableEntityException(
        `${path}.perspective debe ser ACTOR u OBSERVER.`,
      );
    }
    if (!isValidLucidityLevel(a.lucidityLevel)) {
      throw new UnprocessableEntityException(
        `${path}.lucidityLevel debe ser un entero entre ${LUCIDITY_MIN} y ${LUCIDITY_MAX} (0 = sin lucidez).`,
      );
    }
    if (
      !a.entities ||
      typeof a.entities !== 'object' ||
      Array.isArray(a.entities)
    ) {
      throw new UnprocessableEntityException(
        `${path}.entities debe ser un objeto.`,
      );
    }
    const e = a.entities as Record<string, unknown>;
    this.validateEntityArray(
      e.characters ?? [],
      `${path}.entities.characters`,
      'character',
    );
    this.validateEntityArray(
      e.locations ?? [],
      `${path}.entities.locations`,
      'location',
    );
    this.validateEntityArray(
      e.objects ?? [],
      `${path}.entities.objects`,
      'object',
    );
    this.validateEntityArray(
      e.feelings ?? [],
      `${path}.entities.feelings`,
      'feeling',
    );
  }

  private validateEntityArray(
    arr: unknown,
    path: string,
    kind: 'character' | 'location' | 'object' | 'feeling',
  ): void {
    if (!Array.isArray(arr)) {
      throw new UnprocessableEntityException(`${path} debe ser un array.`);
    }
    arr.forEach((item, i) => {
      const p = `${path}[${i}]`;
      if (kind === 'character') {
        this.validateCharacterEntity(item, p);
      } else if (kind === 'location') {
        this.validateLocationEntity(item, p);
      } else if (kind === 'object') {
        this.validateObjectEntity(item, p);
      } else {
        this.validateFeelingEntity(item, p);
      }
    });
  }

  private validateCharacterEntity(item: unknown, path: string): void {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new UnprocessableEntityException(`${path} debe ser un objeto.`);
    }
    const o = item as Record<string, unknown>;
    if (typeof o.id !== 'string' || !o.id) {
      throw new UnprocessableEntityException(`${path}.id es obligatorio.`);
    }
    if (typeof o.name !== 'string') {
      throw new UnprocessableEntityException(`${path}.name es obligatorio.`);
    }
    if (typeof o.description !== 'string') {
      throw new UnprocessableEntityException(
        `${path}.description es obligatorio.`,
      );
    }
    if (typeof o.isKnown !== 'boolean') {
      throw new UnprocessableEntityException(
        `${path}.isKnown debe ser boolean.`,
      );
    }
    if (typeof o.archetype !== 'string' || !ARCHETYPES.has(o.archetype)) {
      throw new UnprocessableEntityException(`${path}.archetype no válido.`);
    }
    if (o.catalogCharacterId !== undefined && o.catalogCharacterId !== null) {
      if (typeof o.catalogCharacterId !== 'string' || !o.catalogCharacterId) {
        throw new UnprocessableEntityException(
          `${path}.catalogCharacterId debe ser un string no vacío.`,
        );
      }
    }
    if (
      o.imageUri !== undefined &&
      o.imageUri !== null &&
      typeof o.imageUri !== 'string'
    ) {
      throw new UnprocessableEntityException(
        `${path}.imageUri debe ser string.`,
      );
    }
  }

  private validateLocationEntity(item: unknown, path: string): void {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new UnprocessableEntityException(`${path} debe ser un objeto.`);
    }
    const o = item as Record<string, unknown>;
    if (typeof o.id !== 'string' || !o.id) {
      throw new UnprocessableEntityException(`${path}.id es obligatorio.`);
    }
    if (typeof o.isFamiliar !== 'boolean') {
      throw new UnprocessableEntityException(
        `${path}.isFamiliar debe ser boolean.`,
      );
    }
    if (typeof o.setting !== 'string' || !LOCATION_SETTINGS.has(o.setting)) {
      throw new UnprocessableEntityException(`${path}.setting no válido.`);
    }
    if (typeof o.name !== 'string') {
      throw new UnprocessableEntityException(`${path}.name es obligatorio.`);
    }
    if (typeof o.description !== 'string') {
      throw new UnprocessableEntityException(
        `${path}.description es obligatorio.`,
      );
    }
    if (o.catalogLocationId !== undefined && o.catalogLocationId !== null) {
      if (typeof o.catalogLocationId !== 'string' || !o.catalogLocationId) {
        throw new UnprocessableEntityException(
          `${path}.catalogLocationId debe ser un string no vacío.`,
        );
      }
    }
    if (
      o.imageUri !== undefined &&
      o.imageUri !== null &&
      typeof o.imageUri !== 'string'
    ) {
      throw new UnprocessableEntityException(
        `${path}.imageUri debe ser string.`,
      );
    }
  }

  private validateObjectEntity(item: unknown, path: string): void {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new UnprocessableEntityException(`${path} debe ser un objeto.`);
    }
    const o = item as Record<string, unknown>;
    if (typeof o.id !== 'string' || !o.id) {
      throw new UnprocessableEntityException(`${path}.id es obligatorio.`);
    }
    if (typeof o.name !== 'string') {
      throw new UnprocessableEntityException(`${path}.name es obligatorio.`);
    }
    if (
      o.description !== undefined &&
      o.description !== null &&
      typeof o.description !== 'string'
    ) {
      throw new UnprocessableEntityException(
        `${path}.description debe ser string.`,
      );
    }
    if (o.catalogObjectId !== undefined && o.catalogObjectId !== null) {
      if (typeof o.catalogObjectId !== 'string' || !o.catalogObjectId) {
        throw new UnprocessableEntityException(
          `${path}.catalogObjectId debe ser un string no vacío.`,
        );
      }
    }
    if (
      o.imageUri !== undefined &&
      o.imageUri !== null &&
      typeof o.imageUri !== 'string'
    ) {
      throw new UnprocessableEntityException(
        `${path}.imageUri debe ser string.`,
      );
    }
  }

  private validateFeelingEntity(item: unknown, path: string): void {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new UnprocessableEntityException(`${path} debe ser un objeto.`);
    }
    const o = item as Record<string, unknown>;
    if (typeof o.id !== 'string' || !o.id) {
      throw new UnprocessableEntityException(`${path}.id es obligatorio.`);
    }
    if (typeof o.kind !== 'string' || !FEELING_KINDS.has(o.kind)) {
      throw new UnprocessableEntityException(`${path}.kind no válido.`);
    }
    if (o.intensity !== undefined && o.intensity !== null) {
      if (typeof o.intensity !== 'number' || !Number.isFinite(o.intensity)) {
        throw new UnprocessableEntityException(
          `${path}.intensity debe ser número.`,
        );
      }
    }
    if (
      o.notes !== undefined &&
      o.notes !== null &&
      typeof o.notes !== 'string'
    ) {
      throw new UnprocessableEntityException(`${path}.notes debe ser string.`);
    }
  }

  private async assertCatalogReferences(derived: {
    catalogCharacterIds: string[];
    catalogLocationIds: string[];
    catalogObjectIds: string[];
  }): Promise<void> {
    const uChar = [...new Set(derived.catalogCharacterIds)];
    if (uChar.length > 0) {
      const n = await this.catalogCharacterModel.countDocuments({
        _id: { $in: uChar },
      });
      if (n !== uChar.length) {
        throw new UnprocessableEntityException(
          'Uno o más catalogCharacterId no existen en el catálogo.',
        );
      }
    }
    const uLoc = [...new Set(derived.catalogLocationIds)];
    if (uLoc.length > 0) {
      const n = await this.catalogLocationModel.countDocuments({
        _id: { $in: uLoc },
      });
      if (n !== uLoc.length) {
        throw new UnprocessableEntityException(
          'Uno o más catalogLocationId no existen en el catálogo.',
        );
      }
    }
    const uObj = [...new Set(derived.catalogObjectIds)];
    if (uObj.length > 0) {
      const n = await this.catalogDreamObjectModel.countDocuments({
        _id: { $in: uObj },
      });
      if (n !== uObj.length) {
        throw new UnprocessableEntityException(
          'Uno o más catalogObjectId no existen en el catálogo.',
        );
      }
    }
  }

  private async assertLifeEventsExist(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const unique = [...new Set(ids)];
    const n = await this.lifeEventModel.countDocuments({
      _id: { $in: unique },
    });
    if (n !== unique.length) {
      throw new UnprocessableEntityException(
        'Uno o más relatedLifeEventIds no existen (tabla life_events).',
      );
    }
  }
}

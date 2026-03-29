import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

/** Product flow: Draft → Elements → Structured → Thought (user-facing steps). */
export enum DreamSessionStatus {
  DRAFT = 'DRAFT',
  ELEMENTS = 'ELEMENTS',
  STRUCTURED = 'STRUCTURED',
  THOUGHT = 'THOUGHT',
}

/** Character appearance inside a dream (used for joins / indexes only). */
@Schema({ _id: false })
export class CharacterInDreamEntity {
  @Prop({ type: Types.ObjectId, ref: 'Character', required: true })
  characterId: Types.ObjectId;
}

export const CharacterInDreamEntitySchema = SchemaFactory.createForClass(
  CharacterInDreamEntity,
);

/** Location appearance inside a dream (used for joins / indexes only). */
@Schema({ _id: false })
export class LocationInDreamEntity {
  @Prop({ type: Types.ObjectId, ref: 'Location', required: true })
  locationId: Types.ObjectId;
}

export const LocationInDreamEntitySchema = SchemaFactory.createForClass(
  LocationInDreamEntity,
);

/** Dream object (prop) appearance inside a dream (joins / indexes only). */
@Schema({ _id: false })
export class ObjectInDreamEntity {
  @Prop({ type: Types.ObjectId, ref: 'DreamObject', required: true })
  objectId: Types.ObjectId;
}

export const ObjectInDreamEntitySchema =
  SchemaFactory.createForClass(ObjectInDreamEntity);

/** Narrative event row inside a dream (joins / indexes only). */
@Schema({ _id: false })
export class EventInDreamEntity {
  @Prop({ type: Types.ObjectId, ref: 'DreamEvent', required: true })
  eventId: Types.ObjectId;
}

export const EventInDreamEntitySchema =
  SchemaFactory.createForClass(EventInDreamEntity);

/** Context-of-life row inside a dream (joins / indexes only). */
@Schema({ _id: false })
export class ContextLifeInDreamEntity {
  @Prop({ type: Types.ObjectId, ref: 'ContextLife', required: true })
  contextLifeId: Types.ObjectId;
}

export const ContextLifeInDreamEntitySchema = SchemaFactory.createForClass(
  ContextLifeInDreamEntity,
);

/** Feeling row inside a dream (joins / indexes only). */
@Schema({ _id: false })
export class FeelingInDreamEntity {
  @Prop({ type: Types.ObjectId, ref: 'Feeling', required: true })
  feelingId: Types.ObjectId;
}

export const FeelingInDreamEntitySchema =
  SchemaFactory.createForClass(FeelingInDreamEntity);

@Schema({ _id: false })
export class DreamEntities {
  @Prop({ type: [CharacterInDreamEntitySchema], default: [] })
  characters: CharacterInDreamEntity[];

  @Prop({ type: [LocationInDreamEntitySchema], default: [] })
  locations: LocationInDreamEntity[];

  @Prop({ type: [ObjectInDreamEntitySchema], default: [] })
  objects: ObjectInDreamEntity[];

  @Prop({ type: [EventInDreamEntitySchema], default: [] })
  events: EventInDreamEntity[];

  @Prop({ type: [ContextLifeInDreamEntitySchema], default: [] })
  contextLife: ContextLifeInDreamEntity[];

  @Prop({ type: [FeelingInDreamEntitySchema], default: [] })
  feelings: FeelingInDreamEntity[];
}

export const DreamEntitiesSchema = SchemaFactory.createForClass(DreamEntities);

@Schema({ _id: false })
export class DreamAnalysis {
  @Prop({ type: [String], default: [] })
  perspectives?: string[];

  @Prop({ type: Number, min: 0, max: 10 })
  lucidityLevel?: number;

  /**
   * Linked catalog ids (and optional quotes on subdocs when added).
   * TODO (Elements step): business rules for “new vs existing” catalog rows, dedup, and
   * validating ObjectIds against `characters`, `locations`, etc. This layer only stores
   * whatever the API sends; no orchestration here yet.
   */
  @Prop({ type: DreamEntitiesSchema })
  entities?: DreamEntities;
}

export const DreamAnalysisSchema = SchemaFactory.createForClass(DreamAnalysis);

@Schema({ timestamps: true, collection: 'dream_sessions' })
export class DreamSession {
  @Prop({ type: Date })
  timestamp?: Date;

  @Prop({
    type: String,
    enum: Object.values(DreamSessionStatus),
    default: DreamSessionStatus.DRAFT,
  })
  status: DreamSessionStatus;

  @Prop({ type: String, trim: true, default: '' })
  rawNarrative: string;

  @Prop({ type: [String], default: [] })
  dreamKind: string[];

  @Prop({ type: [String], default: [] })
  dreamImages: string[];

  @Prop({ type: String, trim: true, default: undefined })
  userThought?: string;

  /**
   * AI-generated summary / commentary on the dream.
   * TODO (IA): populate via a separate pipeline or endpoint — not from this basic CRUD service.
   */
  @Prop({ type: String, trim: true, default: undefined })
  aiSummarize?: string;

  @Prop({ type: DreamAnalysisSchema })
  analysis?: DreamAnalysis;
}

export const DreamSessionSchema = SchemaFactory.createForClass(DreamSession);

/**
 * Persisted document shape. Nested `analysis` is inlined (not `DreamAnalysis`) so query typings
 * and ESLint do not hit a phantom `error` type from schema class cycles.
 */
export interface DreamSessionDocument {
  _id: Types.ObjectId;
  timestamp?: Date;
  status: DreamSessionStatus;
  rawNarrative: string;
  dreamKind: string[];
  dreamImages: string[];
  userThought?: string;
  aiSummarize?: string;
  analysis?: {
    perspectives?: string[];
    lucidityLevel?: number;
    entities?: {
      characters?: Array<{ characterId: Types.ObjectId }>;
      locations?: Array<{ locationId: Types.ObjectId }>;
      objects?: Array<{ objectId: Types.ObjectId }>;
      events?: Array<{ eventId: Types.ObjectId }>;
      contextLife?: Array<{ contextLifeId: Types.ObjectId }>;
      feelings?: Array<{ feelingId: Types.ObjectId }>;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

DreamSessionSchema.index({
  'analysis.entities.characters.characterId': 1,
});

DreamSessionSchema.index({
  'analysis.entities.locations.locationId': 1,
});

DreamSessionSchema.index({
  'analysis.entities.objects.objectId': 1,
});

DreamSessionSchema.index({
  'analysis.entities.events.eventId': 1,
});

DreamSessionSchema.index({
  'analysis.entities.contextLife.contextLifeId': 1,
});

DreamSessionSchema.index({
  'analysis.entities.feelings.feelingId': 1,
});

DreamSessionSchema.index({ status: 1 });
DreamSessionSchema.index({ timestamp: -1 });

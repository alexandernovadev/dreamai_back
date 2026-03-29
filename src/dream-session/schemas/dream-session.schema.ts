import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

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
}

export const DreamEntitiesSchema = SchemaFactory.createForClass(DreamEntities);

@Schema({ _id: false })
export class DreamAnalysis {
  @Prop({ type: DreamEntitiesSchema })
  entities?: DreamEntities;
}

export const DreamAnalysisSchema = SchemaFactory.createForClass(DreamAnalysis);

@Schema({ timestamps: true, collection: 'dream_sessions' })
export class DreamSession {
  @Prop({ type: Date })
  timestamp?: Date;

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
  analysis?: {
    entities?: {
      characters?: Array<{ characterId: Types.ObjectId }>;
      locations?: Array<{ locationId: Types.ObjectId }>;
      objects?: Array<{ objectId: Types.ObjectId }>;
      events?: Array<{ eventId: Types.ObjectId }>;
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

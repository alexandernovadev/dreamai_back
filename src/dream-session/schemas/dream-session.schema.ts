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

@Schema({ _id: false })
export class DreamEntities {
  @Prop({ type: [CharacterInDreamEntitySchema], default: [] })
  characters: CharacterInDreamEntity[];

  @Prop({ type: [LocationInDreamEntitySchema], default: [] })
  locations: LocationInDreamEntity[];
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

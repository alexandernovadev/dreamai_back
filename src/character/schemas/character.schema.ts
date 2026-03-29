import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum CharacterArchetype {
  SHADOW = 'SHADOW',
  ANIMA_ANIMUS = 'ANIMA_ANIMUS',
  WISE_FIGURE = 'WISE_FIGURE',
  PERSONA = 'PERSONA',
  UNKNOWN = 'UNKNOWN',
}

@Schema({ timestamps: true })
export class Character {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true })
  isKnown: boolean;

  @Prop({
    type: String,
    enum: CharacterArchetype,
    required: true,
  })
  archetype: CharacterArchetype;

  @Prop({ trim: true, default: undefined })
  imageUri?: string;
}

export const CharacterSchema = SchemaFactory.createForClass(Character);

/** Persisted document shape (plain interface plays well with Mongoose query typings + ESLint). */
export interface CharacterDocument {
  _id: Types.ObjectId;
  name: string;
  description: string;
  isKnown: boolean;
  archetype: CharacterArchetype;
  imageUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

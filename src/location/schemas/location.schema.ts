import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum LocationSetting {
  URBAN = 'URBAN',
  NATURE = 'NATURE',
  INDOOR = 'INDOOR',
  ABSTRACT = 'ABSTRACT',
}

@Schema({ timestamps: true, collection: 'locations' })
export class Location {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true })
  isFamiliar: boolean;

  @Prop({
    type: String,
    enum: LocationSetting,
    required: true,
  })
  setting: LocationSetting;

  @Prop({ trim: true, default: undefined })
  imageUri?: string;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

/** Persisted document shape (plain interface plays well with Mongoose query typings + ESLint). */
export interface LocationDocument {
  _id: Types.ObjectId;
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: LocationSetting;
  imageUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

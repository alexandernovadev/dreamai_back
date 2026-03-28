import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { LocationSetting } from '../domain/enums';
import { applyIdJsonSchema } from './id-json.plugin';

export type CatalogLocationDocument = HydratedDocument<CatalogLocation>;

@Schema({ timestamps: true, collection: 'catalog_locations' })
export class CatalogLocation {
  @Prop({ default: false })
  isFamiliar: boolean;

  @Prop({ type: String, enum: LocationSetting, required: true })
  setting: LocationSetting;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  imageUri?: string;
}

export const CatalogLocationSchema =
  SchemaFactory.createForClass(CatalogLocation);
applyIdJsonSchema(CatalogLocationSchema);

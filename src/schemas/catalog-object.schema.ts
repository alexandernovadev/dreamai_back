import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applyIdJsonSchema } from './id-json.plugin';

export type CatalogDreamObjectDocument = HydratedDocument<CatalogDreamObject>;

@Schema({ timestamps: true, collection: 'catalog_dream_objects' })
export class CatalogDreamObject {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  imageUri?: string;
}

export const CatalogDreamObjectSchema =
  SchemaFactory.createForClass(CatalogDreamObject);
applyIdJsonSchema(CatalogDreamObjectSchema);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Archetype } from '../domain/enums';
import { applyIdJsonSchema } from './id-json.plugin';

export type CatalogCharacterDocument = HydratedDocument<CatalogCharacter>;

@Schema({ timestamps: true, collection: 'catalog_characters' })
export class CatalogCharacter {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: false })
  isKnown: boolean;

  @Prop({ type: String, enum: Archetype, required: true })
  archetype: Archetype;

  @Prop()
  imageUri?: string;
}

export const CatalogCharacterSchema =
  SchemaFactory.createForClass(CatalogCharacter);
applyIdJsonSchema(CatalogCharacterSchema);

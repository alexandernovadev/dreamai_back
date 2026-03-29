import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'dream_objects' })
export class DreamObject {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: undefined })
  description?: string;

  @Prop({ trim: true, default: undefined })
  imageUri?: string;
}

export const DreamObjectSchema = SchemaFactory.createForClass(DreamObject);

export interface DreamObjectDocument {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  imageUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

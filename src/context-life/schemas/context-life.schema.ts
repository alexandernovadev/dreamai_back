import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'context_lives' })
export class ContextLife {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true, default: undefined })
  description?: string;
}

export const ContextLifeSchema = SchemaFactory.createForClass(ContextLife);

export interface ContextLifeDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

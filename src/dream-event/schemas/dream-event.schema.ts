import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { DreamSession } from '../../dream-session/schemas/dream-session.schema';

@Schema({ timestamps: true, collection: 'dream_events' })
export class DreamEvent {
  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ trim: true, default: undefined })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: DreamSession.name, required: true })
  dreamSessionId: Types.ObjectId;
}

export const DreamEventSchema = SchemaFactory.createForClass(DreamEvent);

export interface DreamEventDocument {
  _id: Types.ObjectId;
  label: string;
  description?: string;
  dreamSessionId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

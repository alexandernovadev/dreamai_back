import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { DreamSession } from '../../dream-session/schemas/dream-session.schema';
import { FeelingKind } from '../feeling-kind';

@Schema({ timestamps: true, collection: 'feelings' })
export class Feeling {
  @Prop({
    type: String,
    enum: Object.values(FeelingKind),
    required: true,
  })
  kind: FeelingKind;

  @Prop({ type: Number, min: 0, max: 10 })
  intensity?: number;

  @Prop({ trim: true, default: undefined })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: DreamSession.name, required: true })
  dreamSessionId: Types.ObjectId;
}

export const FeelingSchema = SchemaFactory.createForClass(Feeling);

export interface FeelingDocument {
  _id: Types.ObjectId;
  kind: FeelingKind;
  intensity?: number;
  notes?: string;
  dreamSessionId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { DreamKind, DreamSessionStatus } from '../domain/enums';
import { applyIdJsonSchema } from './id-json.plugin';

export type DreamSessionDocument = HydratedDocument<DreamSession>;

@Schema({ timestamps: true, collection: 'dream_sessions' })
export class DreamSession {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: String, enum: DreamSessionStatus, required: true })
  status: DreamSessionStatus;

  @Prop({ type: String, enum: DreamKind, required: true })
  dreamKind: DreamKind;

  @Prop()
  rawNarrative?: string;

  @Prop({ type: [String], default: [] })
  relatedLifeEventIds: string[];

  @Prop()
  userThought?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: () => [] })
  dreams: unknown;

  @Prop({
    type: [
      {
        publicId: { type: String, required: true },
        secureUrl: { type: String, required: true },
      },
    ],
    default: [],
  })
  dreamImages: { publicId: string; secureUrl: string }[];

  @Prop({ type: [String], default: [] })
  catalogCharacterIds: string[];

  @Prop({ type: [String], default: [] })
  catalogLocationIds: string[];

  @Prop({ type: [String], default: [] })
  catalogObjectIds: string[];
}

export const DreamSessionSchema = SchemaFactory.createForClass(DreamSession);
applyIdJsonSchema(DreamSessionSchema);

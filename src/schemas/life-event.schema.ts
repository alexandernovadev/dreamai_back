import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { applyIdJsonSchema } from './id-json.plugin';

export type LifeEventDocument = HydratedDocument<LifeEvent>;

@Schema({ timestamps: true, collection: 'life_events' })
export class LifeEvent {
  @Prop({ required: true })
  title: string;

  @Prop()
  note?: string;

  @Prop()
  occurredAt?: Date;
}

export const LifeEventSchema = SchemaFactory.createForClass(LifeEvent);
applyIdJsonSchema(LifeEventSchema);

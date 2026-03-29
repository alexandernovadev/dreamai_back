import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DreamSession,
  DreamSessionSchema,
} from '../dream-session/schemas/dream-session.schema';
import { DreamEventController } from './dream-event.controller';
import { DreamEventService } from './dream-event.service';
import { DreamEvent, DreamEventSchema } from './schemas/dream-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DreamEvent.name, schema: DreamEventSchema },
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  controllers: [DreamEventController],
  providers: [DreamEventService],
  exports: [DreamEventService],
})
export class DreamEventModule {}

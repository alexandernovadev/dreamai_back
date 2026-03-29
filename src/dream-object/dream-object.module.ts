import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DreamSession,
  DreamSessionSchema,
} from '../dream-session/schemas/dream-session.schema';
import { DreamObjectController } from './dream-object.controller';
import { DreamObjectService } from './dream-object.service';
import { DreamObject, DreamObjectSchema } from './schemas/dream-object.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DreamObject.name, schema: DreamObjectSchema },
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  controllers: [DreamObjectController],
  providers: [DreamObjectService],
  exports: [DreamObjectService],
})
export class DreamObjectModule {}

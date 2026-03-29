import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DreamSession,
  DreamSessionSchema,
} from './schemas/dream-session.schema';
import { DreamSessionController } from './dream-session.controller';
import { DreamSessionService } from './dream-session.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  controllers: [DreamSessionController],
  providers: [DreamSessionService],
  exports: [MongooseModule],
})
export class DreamSessionModule {}

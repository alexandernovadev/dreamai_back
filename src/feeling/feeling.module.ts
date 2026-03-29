import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DreamSession,
  DreamSessionSchema,
} from '../dream-session/schemas/dream-session.schema';
import { FeelingController } from './feeling.controller';
import { FeelingService } from './feeling.service';
import { Feeling, FeelingSchema } from './schemas/feeling.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feeling.name, schema: FeelingSchema },
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  controllers: [FeelingController],
  providers: [FeelingService],
  exports: [FeelingService],
})
export class FeelingModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContextLifeController } from './context-life.controller';
import { ContextLifeService } from './context-life.service';
import {
  DreamSession,
  DreamSessionSchema,
} from '../dream-session/schemas/dream-session.schema';
import { ContextLife, ContextLifeSchema } from './schemas/context-life.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContextLife.name, schema: ContextLifeSchema },
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  controllers: [ContextLifeController],
  providers: [ContextLifeService],
  exports: [ContextLifeService],
})
export class ContextLifeModule {}

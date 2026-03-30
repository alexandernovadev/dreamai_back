import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Character,
  CharacterSchema,
} from '../character/schemas/character.schema';
import {
  ContextLife,
  ContextLifeSchema,
} from '../context-life/schemas/context-life.schema';
import {
  DreamEvent,
  DreamEventSchema,
} from '../dream-event/schemas/dream-event.schema';
import {
  DreamObject,
  DreamObjectSchema,
} from '../dream-object/schemas/dream-object.schema';
import { Feeling, FeelingSchema } from '../feeling/schemas/feeling.schema';
import {
  Location,
  LocationSchema,
} from '../location/schemas/location.schema';
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
      { name: Character.name, schema: CharacterSchema },
      { name: Location.name, schema: LocationSchema },
      { name: DreamObject.name, schema: DreamObjectSchema },
      { name: DreamEvent.name, schema: DreamEventSchema },
      { name: ContextLife.name, schema: ContextLifeSchema },
      { name: Feeling.name, schema: FeelingSchema },
    ]),
  ],
  controllers: [DreamSessionController],
  providers: [DreamSessionService],
  exports: [MongooseModule],
})
export class DreamSessionModule {}

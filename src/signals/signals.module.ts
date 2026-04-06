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
  DreamSession,
  DreamSessionSchema,
} from '../dream-session/schemas/dream-session.schema';
import {
  DreamObject,
  DreamObjectSchema,
} from '../dream-object/schemas/dream-object.schema';
import { Feeling, FeelingSchema } from '../feeling/schemas/feeling.schema';
import { Location, LocationSchema } from '../location/schemas/location.schema';
import { SignalsController } from './signals.controller';
import { SignalsHubService } from './signals-hub.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
      { name: Location.name, schema: LocationSchema },
      { name: DreamObject.name, schema: DreamObjectSchema },
      { name: DreamEvent.name, schema: DreamEventSchema },
      { name: ContextLife.name, schema: ContextLifeSchema },
      { name: Feeling.name, schema: FeelingSchema },
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  controllers: [SignalsController],
  providers: [SignalsHubService],
})
export class SignalsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterController } from './character.controller';
import { CharacterService } from './character.service';
import {
  DreamSession,
  DreamSessionSchema,
} from '../dream-session/schemas/dream-session.schema';
import { Character, CharacterSchema } from './schemas/character.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
      { name: DreamSession.name, schema: DreamSessionSchema },
    ]),
  ],
  controllers: [CharacterController],
  providers: [CharacterService],
  exports: [CharacterService],
})
export class CharacterModule {}

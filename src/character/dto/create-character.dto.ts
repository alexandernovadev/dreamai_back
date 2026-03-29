import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CharacterArchetype } from '../schemas/character.schema';

export class CreateCharacterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name: string;

  @IsString()
  @MaxLength(16000)
  description: string;

  @IsBoolean()
  isKnown: boolean;

  @IsEnum(CharacterArchetype)
  archetype: CharacterArchetype;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUri?: string;
}

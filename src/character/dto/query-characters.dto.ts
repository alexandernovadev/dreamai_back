import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { transformOptionalBoolean } from '../../common/utils/transform-optional-boolean';
import { CharacterArchetype } from '../schemas/character.schema';

export class QueryCharactersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  nameExact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16000)
  description?: string;

  @IsOptional()
  @Transform(transformOptionalBoolean)
  @IsBoolean()
  isKnown?: boolean;

  @IsOptional()
  @IsEnum(CharacterArchetype)
  archetype?: CharacterArchetype;

  /** If `true`, only rows with a non-empty `imageUri`; if `false`, rows without an image. */
  @IsOptional()
  @Transform(transformOptionalBoolean)
  @IsBoolean()
  hasImage?: boolean;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsDateString()
  updatedFrom?: string;

  @IsOptional()
  @IsDateString()
  updatedTo?: string;
}

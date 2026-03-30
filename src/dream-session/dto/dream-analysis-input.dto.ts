import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DREAM_PERSPECTIVE_VALUES } from '../constants/dream-perspectives.constants';
import { DreamEntitiesInputDto } from './dream-entities-input.dto';

const PERSPECTIVE_WHITELIST = [...DREAM_PERSPECTIVE_VALUES] as string[];

export class DreamAnalysisInputDto {
  @IsOptional()
  @IsArray()
  @IsIn(PERSPECTIVE_WHITELIST, { each: true })
  perspectives?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  lucidityLevel?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => DreamEntitiesInputDto)
  entities?: DreamEntitiesInputDto;
}

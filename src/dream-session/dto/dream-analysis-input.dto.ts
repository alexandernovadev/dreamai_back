import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Optional nested analysis on create/update.
 * TODO (Elements): validate `entities` ObjectIds against catalog collections; for now we persist as sent.
 */
export class DreamAnalysisInputDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perspectives?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  lucidityLevel?: number;

  @IsOptional()
  @IsObject()
  entities?: Record<string, unknown>;
}

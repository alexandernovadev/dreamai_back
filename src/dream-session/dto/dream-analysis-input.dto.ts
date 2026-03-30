import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DreamEntitiesInputDto } from './dream-entities-input.dto';

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
  @ValidateNested()
  @Type(() => DreamEntitiesInputDto)
  entities?: DreamEntitiesInputDto;
}

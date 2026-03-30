import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { DreamSessionStatus } from '../schemas/dream-session.schema';
import { DreamAnalysisInputDto } from './dream-analysis-input.dto';

export class CreateDreamSessionDto {
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @IsOptional()
  @IsEnum(DreamSessionStatus)
  status?: DreamSessionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  rawNarrative?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  dreamKind?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(2000, { each: true })
  dreamImages?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  userThought?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  aiSummarize?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DreamAnalysisInputDto)
  analysis?: DreamAnalysisInputDto;
}

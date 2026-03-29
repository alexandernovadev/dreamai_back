import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DreamSessionStatus } from '../schemas/dream-session.schema';

export class QueryDreamSessionsDto {
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
  @IsEnum(DreamSessionStatus)
  status?: DreamSessionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rawNarrative?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dreamKind?: string;

  @IsOptional()
  @IsDateString()
  timestampFrom?: string;

  @IsOptional()
  @IsDateString()
  timestampTo?: string;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

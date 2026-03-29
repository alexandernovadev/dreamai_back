import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FeelingKind } from '../feeling-kind';

export class CreateFeelingDto {
  @IsEnum(FeelingKind)
  kind: FeelingKind;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  intensity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16000)
  notes?: string;

  @IsMongoId()
  dreamSessionId: string;
}

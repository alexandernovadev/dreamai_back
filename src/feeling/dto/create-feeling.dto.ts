import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateFeelingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  kind: string;

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

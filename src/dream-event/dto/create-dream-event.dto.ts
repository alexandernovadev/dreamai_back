import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateDreamEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(16000)
  description?: string;

  @IsMongoId()
  dreamSessionId: string;
}

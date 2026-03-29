import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContextLifeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(16000)
  description?: string;
}

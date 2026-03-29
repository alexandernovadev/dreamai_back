import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDreamObjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(16000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUri?: string;
}

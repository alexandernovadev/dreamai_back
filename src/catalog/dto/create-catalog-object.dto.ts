import { IsOptional, IsString } from 'class-validator';

export class CreateCatalogObjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUri?: string;
}

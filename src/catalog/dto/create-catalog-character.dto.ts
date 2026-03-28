import { Archetype } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCatalogCharacterDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  isKnown?: boolean;

  @IsEnum(Archetype)
  archetype: Archetype;

  @IsOptional()
  @IsString()
  imageUri?: string;
}

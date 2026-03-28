import { LocationSetting } from '../../domain/enums';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateCatalogLocationDto {
  @IsOptional()
  @IsBoolean()
  isFamiliar?: boolean;

  @IsEnum(LocationSetting)
  setting: LocationSetting;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  imageUri?: string;
}

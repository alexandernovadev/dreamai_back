import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LocationSetting } from '../schemas/location.schema';

export class CreateLocationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  name: string;

  @IsString()
  @MaxLength(16000)
  description: string;

  @IsBoolean()
  isFamiliar: boolean;

  @IsEnum(LocationSetting)
  setting: LocationSetting;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUri?: string;
}

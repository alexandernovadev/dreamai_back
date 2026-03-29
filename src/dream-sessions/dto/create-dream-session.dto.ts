import { DreamKind, DreamSessionStatus } from '../../domain/enums';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DreamImageDto } from './dream-image.dto';

export class CreateDreamSessionDto {
  @IsDateString()
  timestamp: string;

  @IsEnum(DreamSessionStatus)
  status: DreamSessionStatus;

  @IsEnum(DreamKind)
  dreamKind: DreamKind;

  @IsOptional()
  @IsString()
  rawNarrative?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedLifeEventIds?: string[];

  @IsOptional()
  @IsString()
  userThought?: string;

  /** Segmentos (`DreamSegment[]`); si omites, se guarda `[]`. */
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  dreams?: unknown[];

  /** Imágenes asociadas al sueño (referencias Cloudinary). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DreamImageDto)
  dreamImages?: DreamImageDto[];
}

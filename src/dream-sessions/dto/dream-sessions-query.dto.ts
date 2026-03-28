import { IsOptional, IsString } from 'class-validator';

export class DreamSessionsQueryDto {
  @IsOptional()
  @IsString()
  catalogCharacterId?: string;

  @IsOptional()
  @IsString()
  catalogLocationId?: string;

  @IsOptional()
  @IsString()
  catalogObjectId?: string;

  @IsOptional()
  @IsString()
  lifeEventId?: string;
}

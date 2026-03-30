import { Type } from 'class-transformer';
import { IsMongoId, IsOptional, ValidateNested } from 'class-validator';

export class CharacterRefDto {
  @IsMongoId()
  characterId: string;
}

export class LocationRefDto {
  @IsMongoId()
  locationId: string;
}

export class ObjectRefDto {
  @IsMongoId()
  objectId: string;
}

export class EventRefDto {
  @IsMongoId()
  eventId: string;
}

export class ContextLifeRefDto {
  @IsMongoId()
  contextLifeId: string;
}

export class FeelingRefDto {
  @IsMongoId()
  feelingId: string;
}

export class DreamEntitiesInputDto {
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CharacterRefDto)
  characters?: CharacterRefDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LocationRefDto)
  locations?: LocationRefDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ObjectRefDto)
  objects?: ObjectRefDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => EventRefDto)
  events?: EventRefDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ContextLifeRefDto)
  contextLife?: ContextLifeRefDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FeelingRefDto)
  feelings?: FeelingRefDto[];
}

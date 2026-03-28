import { PartialType } from '@nestjs/mapped-types';
import { CreateCatalogCharacterDto } from './create-catalog-character.dto';

export class UpdateCatalogCharacterDto extends PartialType(
  CreateCatalogCharacterDto,
) {}

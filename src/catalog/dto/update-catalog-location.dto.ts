import { PartialType } from '@nestjs/mapped-types';
import { CreateCatalogLocationDto } from './create-catalog-location.dto';

export class UpdateCatalogLocationDto extends PartialType(
  CreateCatalogLocationDto,
) {}

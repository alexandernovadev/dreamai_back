import { PartialType } from '@nestjs/mapped-types';
import { CreateCatalogObjectDto } from './create-catalog-object.dto';

export class UpdateCatalogObjectDto extends PartialType(
  CreateCatalogObjectDto,
) {}

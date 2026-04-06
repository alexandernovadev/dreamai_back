import { Controller } from '@nestjs/common';
import { CatalogBaseController } from '../common/base/catalog-base.controller';
import { DreamObjectService } from './dream-object.service';
import { CreateDreamObjectDto } from './dto/create-dream-object.dto';
import { QueryDreamObjectsDto } from './dto/query-dream-objects.dto';
import { UpdateDreamObjectDto } from './dto/update-dream-object.dto';

@Controller('dream-objects')
export class DreamObjectController extends CatalogBaseController<
  DreamObjectService,
  CreateDreamObjectDto,
  UpdateDreamObjectDto,
  QueryDreamObjectsDto
> {
  constructor(protected readonly service: DreamObjectService) {
    super();
  }
}

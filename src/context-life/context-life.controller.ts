import { Controller } from '@nestjs/common';
import { CatalogBaseController } from '../common/base/catalog-base.controller';
import { ContextLifeService } from './context-life.service';
import { CreateContextLifeDto } from './dto/create-context-life.dto';
import { QueryContextLivesDto } from './dto/query-context-lives.dto';
import { UpdateContextLifeDto } from './dto/update-context-life.dto';

@Controller('context-life')
export class ContextLifeController extends CatalogBaseController<
  ContextLifeService,
  CreateContextLifeDto,
  UpdateContextLifeDto,
  QueryContextLivesDto
> {
  constructor(protected readonly service: ContextLifeService) {
    super();
  }
}

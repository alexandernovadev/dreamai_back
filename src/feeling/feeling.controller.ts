import { Controller, Get } from '@nestjs/common';
import { CatalogBaseController } from '../common/base/catalog-base.controller';
import { listFeelingKinds } from './feeling-kind';
import { FeelingService } from './feeling.service';
import { CreateFeelingDto } from './dto/create-feeling.dto';
import { QueryFeelingsDto } from './dto/query-feelings.dto';
import { UpdateFeelingDto } from './dto/update-feeling.dto';

@Controller('feelings')
export class FeelingController extends CatalogBaseController<
  FeelingService,
  CreateFeelingDto,
  UpdateFeelingDto,
  QueryFeelingsDto
> {
  constructor(protected readonly service: FeelingService) {
    super();
  }

  /** Catalog of allowed `kind` values + Spanish labels (registered before `:id`). */
  @Get('kinds')
  listKinds() {
    return { data: listFeelingKinds() };
  }
}

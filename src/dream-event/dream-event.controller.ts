import { Controller } from '@nestjs/common';
import { CatalogBaseController } from '../common/base/catalog-base.controller';
import { DreamEventService } from './dream-event.service';
import { CreateDreamEventDto } from './dto/create-dream-event.dto';
import { QueryDreamEventsDto } from './dto/query-dream-events.dto';
import { UpdateDreamEventDto } from './dto/update-dream-event.dto';

@Controller('dream-events')
export class DreamEventController extends CatalogBaseController<
  DreamEventService,
  CreateDreamEventDto,
  UpdateDreamEventDto,
  QueryDreamEventsDto
> {
  constructor(protected readonly service: DreamEventService) {
    super();
  }
}

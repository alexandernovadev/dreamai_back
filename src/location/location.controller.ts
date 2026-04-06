import { Controller } from '@nestjs/common';
import { CatalogBaseController } from '../common/base/catalog-base.controller';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { QueryLocationsDto } from './dto/query-locations.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Controller('locations')
export class LocationController extends CatalogBaseController<
  LocationService,
  CreateLocationDto,
  UpdateLocationDto,
  QueryLocationsDto
> {
  constructor(protected readonly service: LocationService) {
    super();
  }
}

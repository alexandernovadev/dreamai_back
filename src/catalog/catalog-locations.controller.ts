import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DreamSessionsService } from '../dream-sessions/dream-sessions.service';
import { CatalogLocationsService } from './catalog-locations.service';
import { CreateCatalogLocationDto } from './dto/create-catalog-location.dto';
import { UpdateCatalogLocationDto } from './dto/update-catalog-location.dto';

@Controller('catalog/locations')
export class CatalogLocationsController {
  constructor(
    private readonly catalogLocationsService: CatalogLocationsService,
    private readonly dreamSessionsService: DreamSessionsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCatalogLocationDto) {
    return this.catalogLocationsService.create(dto);
  }

  @Get()
  findAll() {
    return this.catalogLocationsService.findAll();
  }

  @Get(':id/dream-sessions')
  findDreamSessions(@Param('id') id: string) {
    return this.dreamSessionsService.findAll({ catalogLocationId: id });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogLocationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCatalogLocationDto) {
    return this.catalogLocationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalogLocationsService.remove(id);
  }
}

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
import { CatalogObjectsService } from './catalog-objects.service';
import { CreateCatalogObjectDto } from './dto/create-catalog-object.dto';
import { UpdateCatalogObjectDto } from './dto/update-catalog-object.dto';

@Controller('catalog/objects')
export class CatalogObjectsController {
  constructor(
    private readonly catalogObjectsService: CatalogObjectsService,
    private readonly dreamSessionsService: DreamSessionsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCatalogObjectDto) {
    return this.catalogObjectsService.create(dto);
  }

  @Get()
  findAll() {
    return this.catalogObjectsService.findAll();
  }

  @Get(':id/dream-sessions')
  findDreamSessions(@Param('id') id: string) {
    return this.dreamSessionsService.findAll({ catalogObjectId: id });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogObjectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCatalogObjectDto) {
    return this.catalogObjectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalogObjectsService.remove(id);
  }
}

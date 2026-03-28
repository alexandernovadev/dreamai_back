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
import { CatalogCharactersService } from './catalog-characters.service';
import { CreateCatalogCharacterDto } from './dto/create-catalog-character.dto';
import { UpdateCatalogCharacterDto } from './dto/update-catalog-character.dto';

@Controller('catalog/characters')
export class CatalogCharactersController {
  constructor(
    private readonly catalogCharactersService: CatalogCharactersService,
    private readonly dreamSessionsService: DreamSessionsService,
  ) {}

  @Post()
  create(@Body() dto: CreateCatalogCharacterDto) {
    return this.catalogCharactersService.create(dto);
  }

  @Get()
  findAll() {
    return this.catalogCharactersService.findAll();
  }

  /** Sueños donde aparece este personaje (vía `catalogCharacterIds`). */
  @Get(':id/dream-sessions')
  findDreamSessions(@Param('id') id: string) {
    return this.dreamSessionsService.findAll({ catalogCharacterId: id });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogCharactersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCatalogCharacterDto) {
    return this.catalogCharactersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalogCharactersService.remove(id);
  }
}

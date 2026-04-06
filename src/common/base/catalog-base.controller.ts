import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CatalogBaseService } from './catalog-base.service';

/**
 * Base controller for the 6 catalog entity endpoints.
 * Provides create / findAll / findOne / update / remove wired to `CatalogBaseService`.
 *
 * Usage:
 *   @Controller('characters')
 *   export class CharacterController extends CatalogBaseController<CharacterService, CreateCharacterDto, UpdateCharacterDto, QueryCharactersDto> {
 *     constructor(protected readonly service: CharacterService) { super(); }
 *   }
 *
 * NestJS inherits route metadata from base class methods, so no extra decorators needed.
 */
export abstract class CatalogBaseController<
  TService extends CatalogBaseService,
  TCreateDto,
  TUpdateDto,
  TQueryDto,
> {
  protected abstract readonly service: TService;

  @Post()
  create(@Body() dto: TCreateDto): any {
    return (this.service as any).create(dto);
  }

  @Get()
  findAll(@Query() query: TQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: TUpdateDto,
  ): any {
    return (this.service as any).update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    await this.service.remove(id);
  }
}

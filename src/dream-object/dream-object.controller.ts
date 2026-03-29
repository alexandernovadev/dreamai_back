import {
  Body,
  Controller,
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
import { DreamObjectService } from './dream-object.service';
import { CreateDreamObjectDto } from './dto/create-dream-object.dto';
import { QueryDreamObjectsDto } from './dto/query-dream-objects.dto';
import { UpdateDreamObjectDto } from './dto/update-dream-object.dto';

@Controller('dream-objects')
export class DreamObjectController {
  constructor(private readonly dreamObjectService: DreamObjectService) {}

  @Post()
  create(@Body() dto: CreateDreamObjectDto) {
    return this.dreamObjectService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryDreamObjectsDto) {
    return this.dreamObjectService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.dreamObjectService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateDreamObjectDto,
  ) {
    return this.dreamObjectService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    await this.dreamObjectService.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateDreamSessionDto } from './dto/create-dream-session.dto';
import { DreamSessionsQueryDto } from './dto/dream-sessions-query.dto';
import { UpdateDreamSessionDto } from './dto/update-dream-session.dto';
import { DreamSessionsService } from './dream-sessions.service';

@Controller('dream-sessions')
export class DreamSessionsController {
  constructor(private readonly dreamSessionsService: DreamSessionsService) {}

  @Post()
  create(@Body() dto: CreateDreamSessionDto) {
    return this.dreamSessionsService.create(dto);
  }

  @Get()
  findAll(@Query() query: DreamSessionsQueryDto) {
    return this.dreamSessionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dreamSessionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDreamSessionDto) {
    return this.dreamSessionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dreamSessionsService.remove(id);
  }
}

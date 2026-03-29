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
import { QueryDreamSessionsDto } from './dto/query-dream-sessions.dto';
import { UpdateDreamSessionDto } from './dto/update-dream-session.dto';
import { DreamSessionService } from './dream-session.service';

@Controller('dream-sessions')
export class DreamSessionController {
  constructor(private readonly dreamSessionService: DreamSessionService) {}

  @Post()
  create(@Body() dto: CreateDreamSessionDto) {
    return this.dreamSessionService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryDreamSessionsDto) {
    return this.dreamSessionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dreamSessionService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDreamSessionDto) {
    return this.dreamSessionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dreamSessionService.remove(id);
  }
}

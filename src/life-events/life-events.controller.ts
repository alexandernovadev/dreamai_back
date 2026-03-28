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
import { CreateLifeEventDto } from './dto/create-life-event.dto';
import { UpdateLifeEventDto } from './dto/update-life-event.dto';
import { LifeEventsService } from './life-events.service';

@Controller('life-events')
export class LifeEventsController {
  constructor(
    private readonly lifeEventsService: LifeEventsService,
    private readonly dreamSessionsService: DreamSessionsService,
  ) {}

  @Post()
  create(@Body() dto: CreateLifeEventDto) {
    return this.lifeEventsService.create(dto);
  }

  @Get()
  findAll() {
    return this.lifeEventsService.findAll();
  }

  @Get(':id/dream-sessions')
  findDreamSessions(@Param('id') id: string) {
    return this.dreamSessionsService.findAll({ lifeEventId: id });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lifeEventsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLifeEventDto) {
    return this.lifeEventsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lifeEventsService.remove(id);
  }
}

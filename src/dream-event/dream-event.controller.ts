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
import { DreamEventService } from './dream-event.service';
import { CreateDreamEventDto } from './dto/create-dream-event.dto';
import { QueryDreamEventsDto } from './dto/query-dream-events.dto';
import { UpdateDreamEventDto } from './dto/update-dream-event.dto';

@Controller('dream-events')
export class DreamEventController {
  constructor(private readonly dreamEventService: DreamEventService) {}

  @Post()
  create(@Body() dto: CreateDreamEventDto) {
    return this.dreamEventService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryDreamEventsDto) {
    return this.dreamEventService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.dreamEventService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateDreamEventDto,
  ) {
    return this.dreamEventService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    await this.dreamEventService.remove(id);
  }
}

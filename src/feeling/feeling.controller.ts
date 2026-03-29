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
import { listFeelingKinds } from './feeling-kind';
import { FeelingService } from './feeling.service';
import { CreateFeelingDto } from './dto/create-feeling.dto';
import { QueryFeelingsDto } from './dto/query-feelings.dto';
import { UpdateFeelingDto } from './dto/update-feeling.dto';

@Controller('feelings')
export class FeelingController {
  constructor(private readonly feelingService: FeelingService) {}

  @Post()
  create(@Body() dto: CreateFeelingDto) {
    return this.feelingService.create(dto);
  }

  /** Catalog of allowed `kind` values + Spanish labels (register before `:id`). */
  @Get('kinds')
  listKinds() {
    return { data: listFeelingKinds() };
  }

  @Get()
  findAll(@Query() query: QueryFeelingsDto) {
    return this.feelingService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.feelingService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateFeelingDto,
  ) {
    return this.feelingService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    await this.feelingService.remove(id);
  }
}

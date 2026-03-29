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
import { ContextLifeService } from './context-life.service';
import { CreateContextLifeDto } from './dto/create-context-life.dto';
import { QueryContextLivesDto } from './dto/query-context-lives.dto';
import { UpdateContextLifeDto } from './dto/update-context-life.dto';

@Controller('context-lives')
export class ContextLifeController {
  constructor(private readonly contextLifeService: ContextLifeService) {}

  @Post()
  create(@Body() dto: CreateContextLifeDto) {
    return this.contextLifeService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryContextLivesDto) {
    return this.contextLifeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.contextLifeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateContextLifeDto,
  ) {
    return this.contextLifeService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseObjectIdPipe) id: string) {
    await this.contextLifeService.remove(id);
  }
}

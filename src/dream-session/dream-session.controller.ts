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
import { DreamElementsAiService } from './dream-elements-ai.service';
import { DreamThoughtAiService } from './dream-thought-ai.service';
import { CreateDreamSessionDto } from './dto/create-dream-session.dto';
import { QueryDreamSessionsDto } from './dto/query-dream-sessions.dto';
import { SuggestDreamElementsDto } from './dto/suggest-dream-elements.dto';
import { UpdateDreamSessionDto } from './dto/update-dream-session.dto';
import { DreamSessionAnalyticsService } from './dream-session-analytics.service';
import { DreamSessionService } from './dream-session.service';

@Controller('dream-sessions')
export class DreamSessionController {
  constructor(
    private readonly dreamSessionService: DreamSessionService,
    private readonly dreamSessionAnalytics: DreamSessionAnalyticsService,
    private readonly dreamElementsAi: DreamElementsAiService,
    private readonly dreamThoughtAi: DreamThoughtAiService,
  ) {}

  @Post()
  create(@Body() dto: CreateDreamSessionDto) {
    return this.dreamSessionService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryDreamSessionsDto) {
    return this.dreamSessionService.findAll(query);
  }

  /** Resumen global (toda la vida): conteos, histograma de lucidez, top entidades en sueños. */
  @Get('analytics/overview')
  analyticsOverview() {
    return this.dreamSessionAnalytics.getOverview();
  }

  /**
   * Dream AI Help (Elementos): sugiere entidades desde `rawNarrative`, empareja catálogo.
   * No persiste; no borra `analysis.entities` ya guardados.
   */
  @Post(':id/ai/suggest-elements')
  suggestDreamElements(
    @Param('id') id: string,
    @Body() dto: SuggestDreamElementsDto,
  ) {
    return this.dreamElementsAi.suggestForSession(id, dto.locale);
  }

  /**
   * Reflexión: lectura sugerida desde `rawNarrative` + `userThought` (si existe).
   * No persiste.
   */
  @Post(':id/ai/suggest-thought')
  suggestThought(
    @Param('id') id: string,
    @Body() dto: SuggestDreamElementsDto,
  ) {
    return this.dreamThoughtAi.suggestForSession(id, dto.locale);
  }

  /** Sesión + catálogos resueltos en batch (sin N+1 en el cliente). */
  @Get(':id/hydrated')
  findOneHydrated(@Param('id') id: string) {
    return this.dreamSessionService.findOneHydrated(id);
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

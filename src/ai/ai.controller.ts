import { Body, Controller, Post } from '@nestjs/common';
import { AiSuggestionsService } from './ai-suggestions.service';
import { SuggestEntitiesDto } from './dto/suggest-entities.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiSuggestions: AiSuggestionsService) {}

  /**
   * Sugiere personajes, lugares y objetos a partir de texto libre del sueño.
   * No persiste datos; el cliente mapea a `DreamSegment.analysis` y al catálogo.
   */
  @Post('suggest-entities')
  suggestEntities(@Body() dto: SuggestEntitiesDto) {
    return this.aiSuggestions.suggestEntities(dto.text, dto.locale);
  }
}

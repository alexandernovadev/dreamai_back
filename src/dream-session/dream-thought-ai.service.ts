import { BadRequestException, Injectable } from '@nestjs/common';
import { AiSuggestionsService } from '../ai/ai-suggestions.service';
import { buildThoughtReadingContextPayload } from './dream-thought-ai-payload';
import type { DreamThoughtSuggestResponse } from './dream-thought-suggest.types';
import { DreamSessionService } from './dream-session.service';

@Injectable()
export class DreamThoughtAiService {
  constructor(
    private readonly dreamSessionService: DreamSessionService,
    private readonly aiSuggestions: AiSuggestionsService,
  ) {}

  /**
   * Envía a la IA solo contexto limpio: narrativa, notas opcionales, y `hydrated` sin IDs
   * (listas ordenadas como en `analysis.entities`). No persiste. Respuesta: `suggestion`.
   */
  async suggestForSession(
    sessionId: string,
    locale?: string,
  ): Promise<DreamThoughtSuggestResponse> {
    const { session, hydrated } =
      await this.dreamSessionService.findOneHydrated(sessionId);

    const s = session as { rawNarrative?: string };
    const narrative =
      typeof s.rawNarrative === 'string' ? s.rawNarrative.trim() : '';
    if (!narrative) {
      throw new BadRequestException(
        'La sesión no tiene narrativa (`rawNarrative`) para esta sugerencia.',
      );
    }

    const contextPayload = buildThoughtReadingContextPayload(session, hydrated);

    const { reading } = await this.aiSuggestions.suggestThoughtReading(
      contextPayload,
      locale,
    );

    return {
      schemaVersion: 1,
      dreamSessionId: sessionId,
      suggestion: reading,
    };
  }
}

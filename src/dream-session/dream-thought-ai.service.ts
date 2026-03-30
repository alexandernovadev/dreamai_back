import { BadRequestException, Injectable } from '@nestjs/common';
import { AiSuggestionsService } from '../ai/ai-suggestions.service';
import type { DreamThoughtSuggestResponse } from './dream-thought-suggest.types';
import { DreamSessionService } from './dream-session.service';

@Injectable()
export class DreamThoughtAiService {
  constructor(
    private readonly dreamSessionService: DreamSessionService,
    private readonly aiSuggestions: AiSuggestionsService,
  ) {}

  /**
   * Lee `rawNarrative` y opcionalmente `userThought`, genera una lectura sugerida.
   * No persiste en DB.
   */
  async suggestForSession(
    sessionId: string,
    locale?: string,
  ): Promise<DreamThoughtSuggestResponse> {
    const session = await this.dreamSessionService.findOne(sessionId);
    const narrative = session.rawNarrative?.trim() ?? '';
    if (!narrative) {
      throw new BadRequestException(
        'La sesión no tiene narrativa (`rawNarrative`) para esta sugerencia.',
      );
    }

    const thought = session.userThought?.trim();
    const { reading } = await this.aiSuggestions.suggestThoughtReading(
      narrative,
      thought || undefined,
      locale,
    );

    return {
      schemaVersion: 1,
      dreamSessionId: sessionId,
      suggestion: reading,
    };
  }
}

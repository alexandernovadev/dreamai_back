import { BadRequestException, Injectable } from '@nestjs/common';
import { AiSuggestionsService } from '../ai/ai-suggestions.service';
import { buildThoughtReadingContextPayload } from './dream-thought-ai-payload';
import { DreamSessionService } from './dream-session.service';

@Injectable()
export class DreamRecentSummarizeAiService {
  constructor(
    private readonly dreamSessionService: DreamSessionService,
    private readonly aiSuggestions: AiSuggestionsService,
  ) {}

  /**
   * Últimos 6 sueños (cualquier status), hidratados en paralelo; IA devuelve texto (no persiste).
   */
  async summarizeRecent(
    locale?: string,
  ): Promise<{ schemaVersion: 1; summary: string }> {
    const { data } = await this.dreamSessionService.findAll({
      page: 1,
      limit: 6,
    });

    const ids = data.map((d) => String((d as { _id: unknown })._id));

    const payloads = await Promise.all(
      ids.map(async (id) => {
        const { session, hydrated } =
          await this.dreamSessionService.findOneHydrated(id);
        return buildThoughtReadingContextPayload(session, hydrated);
      }),
    );

    const withNarrative = payloads.filter(
      (p) => typeof p.narrative === 'string' && p.narrative.trim().length > 0,
    );

    if (withNarrative.length === 0) {
      throw new BadRequestException(
        'No hay sueños con narrativa para analizar.',
      );
    }

    const { summary } = await this.aiSuggestions.suggestRecentDreamsSummary(
      withNarrative,
      locale,
    );

    return { schemaVersion: 1, summary };
  }
}

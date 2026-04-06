import { BadRequestException, Injectable } from '@nestjs/common';
import { AiSuggestionsService } from '../ai/ai-suggestions.service';
import { buildThoughtReadingContextPayload } from './dream-thought-ai-payload';
import {
  DreamSessionService,
  MAX_DREAMS_FOR_RANGE_SUMMARY,
} from './dream-session.service';
import type { SummarizeRecentDto } from './dto/summarize-recent.dto';
import { utcInclusiveDayBounds } from './dream-date-range.util';

@Injectable()
export class DreamRecentSummarizeAiService {
  constructor(
    private readonly dreamSessionService: DreamSessionService,
    private readonly aiSuggestions: AiSuggestionsService,
  ) {}

  /**
   * Opción A: últimos N por **fecha del sueño** (`timestamp` desc).
   * Opción B: rango de fechas del sueño; si el cliente envía `timestampStart`/`timestampEnd` (día local → ISO), esos mandan; si no, rango por día UTC desde `YYYY-MM-DD`.
   */
  async summarizeRecent(dto: SummarizeRecentDto): Promise<{
    schemaVersion: 1;
    summary: string;
    count: number;
    withNarrativeCount: number;
    capped?: boolean;
  }> {
    const locale = dto.locale;
    if (dto.dreamDateFrom && dto.dreamDateTo) {
      return this.summarizeByDateRange(dto, locale);
    }
    if (dto.dreamDateFrom || dto.dreamDateTo) {
      throw new BadRequestException(
        'Indica fecha desde y hasta (YYYY-MM-DD), o deja las fechas vacías para usar la cantidad.',
      );
    }
    return this.summarizeByLimit(locale, dto.limit ?? 10);
  }

  private async summarizeByLimit(
    locale: string | undefined,
    limit: number,
  ): Promise<{
    schemaVersion: 1;
    summary: string;
    count: number;
    withNarrativeCount: number;
  }> {
    const { ids, count } =
      await this.dreamSessionService.findRecentIdsByDreamTimestamp(limit);

    if (ids.length === 0) {
      throw new BadRequestException(
        'No hay sueños con fecha del sueño registrada. Revisa en Detalle que tengan fecha/hora.',
      );
    }

    const { withNarrative, withNarrativeCount } =
      await this.hydrateAndFilterNarrative(ids);

    if (withNarrative.length === 0) {
      throw new BadRequestException(
        'No hay sueños con narrativa para analizar.',
      );
    }

    const { summary } = await this.aiSuggestions.suggestRecentDreamsSummary(
      withNarrative,
      locale,
    );

    return {
      schemaVersion: 1,
      summary,
      count,
      withNarrativeCount,
    };
  }

  private async summarizeByDateRange(
    dto: SummarizeRecentDto,
    locale: string | undefined,
  ): Promise<{
    schemaVersion: 1;
    summary: string;
    count: number;
    withNarrativeCount: number;
    capped: boolean;
  }> {
    const { start, end } = this.resolveDreamTimestampBounds(dto);
    if (end < start) {
      throw new BadRequestException(
        'La fecha "hasta" debe ser igual o posterior a "desde".',
      );
    }

    const { ids, total, truncated } =
      await this.dreamSessionService.findIdsInTimestampRange(
        start,
        end,
        MAX_DREAMS_FOR_RANGE_SUMMARY,
      );

    const count = total;

    if (ids.length === 0) {
      throw new BadRequestException(
        'No hay sueños en ese rango de fechas (fecha del sueño).',
      );
    }

    const { withNarrative, withNarrativeCount } =
      await this.hydrateAndFilterNarrative(ids);

    if (withNarrative.length === 0) {
      throw new BadRequestException(
        'Hay sueños en el rango, pero ninguno tiene narrativa para analizar.',
      );
    }

    const { summary } = await this.aiSuggestions.suggestRecentDreamsSummary(
      withNarrative,
      locale,
    );

    return {
      schemaVersion: 1,
      summary,
      count,
      withNarrativeCount,
      capped: truncated,
    };
  }

  /** Prioridad: `timestampStart`/`timestampEnd` (cliente, día local) → si no, `YYYY-MM-DD` como día UTC. */
  private resolveDreamTimestampBounds(dto: SummarizeRecentDto): {
    start: Date;
    end: Date;
  } {
    if ((dto.timestampStart && !dto.timestampEnd) || (!dto.timestampStart && dto.timestampEnd)) {
      throw new BadRequestException(
        'timestampStart y timestampEnd deben enviarse juntos.',
      );
    }
    if (dto.timestampStart && dto.timestampEnd) {
      const start = new Date(dto.timestampStart);
      const end = new Date(dto.timestampEnd);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException(
          'timestampStart/timestampEnd no son fechas válidas.',
        );
      }
      return { start, end };
    }
    if (dto.dreamDateFrom && dto.dreamDateTo) {
      return utcInclusiveDayBounds(dto.dreamDateFrom, dto.dreamDateTo);
    }
    throw new BadRequestException('Indica rango de fechas del sueño.');
  }

  private async hydrateAndFilterNarrative(ids: string[]): Promise<{
    withNarrative: Record<string, unknown>[];
    withNarrativeCount: number;
  }> {
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

    return {
      withNarrative,
      withNarrativeCount: withNarrative.length,
    };
  }
}

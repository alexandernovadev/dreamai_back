import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const SUMMARIZE_LIMITS = [5, 10, 15, 20] as const;

export type SummarizeRecentLimit = (typeof SUMMARIZE_LIMITS)[number];

/** Cuerpo de `POST /dream-sessions/ai/summarize-recent`. */
export class SummarizeRecentDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  locale?: string;

  /** Cuántos sueños recientes considerar (por defecto 10). Ignorado si van `dreamDateFrom` y `dreamDateTo`. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...SUMMARIZE_LIMITS])
  limit?: SummarizeRecentLimit;

  /** Rango por fecha del sueño (`timestamp`), solo día `YYYY-MM-DD` (UTC). Requiere `dreamDateTo`. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dreamDateFrom?: string;

  /** Inclusive. Misma convención que `dreamDateFrom`. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dreamDateTo?: string;

  /**
   * Límites reales del rango (ISO 8601), calculados en el cliente según día calendario local.
   * Si vienen ambos, tienen prioridad sobre el rango inferido solo con `dreamDateFrom`/`dreamDateTo` (UTC).
   */
  @IsOptional()
  @IsDateString()
  timestampStart?: string;

  @IsOptional()
  @IsDateString()
  timestampEnd?: string;
}

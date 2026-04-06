import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

const SUMMARIZE_LIMITS = [5, 10, 15, 20] as const;

export type SummarizeRecentLimit = (typeof SUMMARIZE_LIMITS)[number];

/** Cuerpo de `POST /dream-sessions/ai/summarize-recent`. */
export class SummarizeRecentDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  locale?: string;

  /** Cuántos sueños recientes considerar (por defecto 10). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...SUMMARIZE_LIMITS])
  limit?: SummarizeRecentLimit;
}

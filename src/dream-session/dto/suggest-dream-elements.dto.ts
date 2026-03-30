import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Cuerpo opcional para `POST /dream-sessions/:id/ai/suggest-elements`. */
export class SuggestDreamElementsDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  locale?: string;
}

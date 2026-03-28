import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SuggestEntitiesDto {
  /**
   * Narrativa del sueño (p. ej. `rawNarrative` o texto de un segmento).
   * Idioma libre; opcionalmente alineá `locale` para guiar al modelo.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(16000)
  text: string;

  /**
   * Código BCP 47 opcional (p. ej. `es`, `en`) para que el modelo mantenga el mismo idioma en descripciones.
   */
  @IsOptional()
  @IsString()
  @MaxLength(32)
  locale?: string;
}

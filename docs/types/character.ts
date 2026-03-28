export enum Archetype {
  /** Lo reprimido o negado: miedos, impulsos,
   * vergüenza; el “otro” en el sueño que refleja lo que no integramos. */
  Shadow = "SHADOW",
  /** Imagen del contrasexual en el psiquismo (ánima / ánimus):
   * vínculo afectivo, inspiración o tirania interior. */
  AnimaAnimus = "ANIMA_ANIMUS",
  /** Figura de sabiduría o guía: anciano, maestro, terapeuta onírico;
   *  orden de sentido frente al caos. */
  WiseFigure = "WISE_FIGURE",
  /** La máscara social: rol público, apariencia, adaptación;
   * cómo nos presentamos ante otros. */
  Persona = "PERSONA",
  /** No encaja claramente en las categorías anteriores
   * o aún no se ha clasificado. */
  Unknown = "UNKNOWN",
}

/** Personaje onírico: quién aparece y con qué peso simbólico aproximado. */
export interface Character {
  /** Id en esta sesión o segmento (instancia). */
  id: string;
  /** Si el personaje viene del catálogo recurrente (misma API que en objetos). */
  catalogCharacterId?: string;
  name: string;
  description: string;
  isKnown: boolean;
  archetype: Archetype;
  imageUri?: string;
}

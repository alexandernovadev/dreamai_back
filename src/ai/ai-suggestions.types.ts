/** Salida normalizada de `POST /ai/suggest-entities` (sugerencias, no persistidas). */

export type SuggestedArchetype =
  | 'SHADOW'
  | 'ANIMA_ANIMUS'
  | 'WISE_FIGURE'
  | 'PERSONA'
  | 'UNKNOWN';

export type SuggestedLocationSetting =
  | 'URBAN'
  | 'NATURE'
  | 'INDOOR'
  | 'ABSTRACT';

export interface SuggestedCharacter {
  name: string;
  description: string;
  isKnown: boolean;
  archetype: SuggestedArchetype;
  /** Fragmento del texto de entrada donde aparece la figura (opcional). */
  quote?: string;
}

export interface SuggestedLocation {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: SuggestedLocationSetting;
  quote?: string;
}

export interface SuggestedDreamObject {
  name: string;
  description?: string;
  quote?: string;
}

export interface SuggestEntitiesResult {
  characters: SuggestedCharacter[];
  locations: SuggestedLocation[];
  objects: SuggestedDreamObject[];
}

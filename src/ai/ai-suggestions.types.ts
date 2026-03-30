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
  /** Autoevaluación del modelo 0–1 (opcional). */
  confidence?: number;
}

export interface SuggestedLocation {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: SuggestedLocationSetting;
  quote?: string;
  confidence?: number;
}

export interface SuggestedDreamObject {
  name: string;
  description?: string;
  quote?: string;
  confidence?: number;
}

export interface SuggestEntitiesResult {
  characters: SuggestedCharacter[];
  locations: SuggestedLocation[];
  objects: SuggestedDreamObject[];
}

/** Hecho narrativo del sueño (catálogo `dream_events`, campo `label`, acotado al sueño). */
export interface SuggestedDreamEvent {
  label: string;
  description?: string;
  quote?: string;
  confidence?: number;
}

/** Salida del modelo para el flujo Elementos (eventos oníricos; sin sentimientos ni contexto vital — eso es manual). */
export interface SuggestDreamElementsResult {
  characters: SuggestedCharacter[];
  locations: SuggestedLocation[];
  objects: SuggestedDreamObject[];
  events: SuggestedDreamEvent[];
}

/** Tipos compartidos por los prompts de IA (Elementos, Reflexión). */

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
  /** Autoevaluación del modelo 0–1 (opcional). */
  confidence?: number;
}

export interface SuggestedLocation {
  name: string;
  description: string;
  isFamiliar: boolean;
  setting: SuggestedLocationSetting;
  confidence?: number;
}

export interface SuggestedDreamObject {
  name: string;
  description?: string;
  confidence?: number;
}

/** Hecho narrativo del sueño (catálogo `dream_events`, campo `label`, acotado al sueño). */
export interface SuggestedDreamEvent {
  label: string;
  description?: string;
  confidence?: number;
}

/** Salida del modelo para el flujo Elementos (eventos oníricos; sin sentimientos ni contexto vital — eso es manual). */
export interface SuggestDreamElementsResult {
  characters: SuggestedCharacter[];
  locations: SuggestedLocation[];
  objects: SuggestedDreamObject[];
  events: SuggestedDreamEvent[];
}

/** Lectura sugerida para el paso Reflexión (no es consejo clínico). */
export interface SuggestThoughtReadingResult {
  reading: string;
}

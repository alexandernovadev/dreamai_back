import type {
  SuggestedCharacter,
  SuggestedDreamEvent,
  SuggestedDreamObject,
  SuggestedLocation,
} from '../ai/ai-suggestions.types';

/** Versión del contrato JSON devuelto por `POST .../ai/suggest-elements`. */
export const DREAM_ELEMENTS_SUGGEST_SCHEMA_VERSION = 1 as const;

/** Coincidencia en catálogo (id Mongo + etiqueta tal como está guardada). */
export interface MatchedCatalogRef {
  catalogId: string;
  canonicalLabel: string;
}

/** Una fila sugerida por IA más resultado de emparejar contra Mongo. */
export interface DreamElementRow<T> {
  fromAi: T;
  match: MatchedCatalogRef | null;
  /**
   * Resaltar en UI: modelo con alta confianza y sin fila previa en catálogo.
   * No reemplaza la decisión del usuario ni persiste nada.
   */
  emphasizeNew: boolean;
}

export interface DreamElementsSuggestResponse {
  schemaVersion: typeof DREAM_ELEMENTS_SUGGEST_SCHEMA_VERSION;
  dreamSessionId: string;
  characters: DreamElementRow<SuggestedCharacter>[];
  locations: DreamElementRow<SuggestedLocation>[];
  objects: DreamElementRow<SuggestedDreamObject>[];
  events: DreamElementRow<SuggestedDreamEvent>[];
}

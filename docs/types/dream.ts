import type { Character } from "./character";
import type { DreamObject } from "./dream-object";
import type { Feeling } from "./feeling";
import type { Location } from "./location";

export enum Perspective {
  Actor = "ACTOR",
  Observer = "OBSERVER",
}

/** Clasificación global de la noche (puede coexistir con matices por segmento). */
export enum DreamKind {
  /** Terror, amenaza fuerte, despertar angustiado. */
  Nightmare = "NIGHTMARE",
  /** Sueño “corriente”, sin etiqueta fuerte. */
  Ordinary = "ORDINARY",
  /** Mundo imaginativo, ficción, irreal encantado. */
  Fantasy = "FANTASY",
  /** Consciencia de que sueñas (aunque sea parcial). */
  Lucid = "LUCID",
  /** Tensión, incomodidad; no llega a pesadilla clara. */
  Anxious = "ANXIOUS",
  /** Absurdo, bizarro, reglas oníricas imposibles. */
  Surreal = "SURREAL",
  /** Repetición de escenario o tema en el tiempo. */
  Recurrent = "RECURRENT",
  /** Varios registros a la vez. */
  Mixed = "MIXED",
  /** Aún sin clasificar. */
  Unknown = "UNKNOWN",
}

/**
 * Flujo de una entrada: texto → refinamiento/extracción → cierre estructural → tu reflexión.
 * La IA puede asistir en REFINING; tú validas y enlazas personajes del catálogo si aplica.
 */
export enum DreamSessionStatus {
  /** 1 — Solo captura: narrativa libre; aún no segmentas ni extraes entidades. */
  Draft = "DRAFT",
  /** 2 — Refinas texto, segmentas, feelings, personajes, lugares y objetos (manual o sugerido). */
  Refining = "REFINING",
  /** 3 — Modelo onírico “completo”: entidades y análisis listos para guardar/patrón. */
  Structured = "STRUCTURED",
  /** 4 — Registraste tu pensamiento o conclusión sobre el sueño. */
  ReflectionsDone = "REFLECTIONS_DONE",
}

export interface DreamSegmentAnalysis {
  perspective: Perspective;
  entities: {
    characters: Character[];
    locations: Location[];
    objects: DreamObject[];
    feelings: Feeling[];
  };
  isLucid: boolean;
}

export interface DreamSegment {
  id: string;
  order: number;
  rawText: string;
  /**
   * Ausente en borrador o hasta que termines la extracción.
   * En REFINING puede ir completándose poco a poco.
   */
  analysis?: DreamSegmentAnalysis;
}

export interface DreamSession {
  readonly id: string;
  timestamp: Date;
  status: DreamSessionStatus;
  /**
   * Registro principal de la noche: pesadilla, normal, fantasía, etc.
   * En `Draft` y `Refining` usar `Unknown` hasta el cierre estructural (`Structured`),
   * donde el usuario confirma o cambia la clasificación.
   */
  dreamKind: DreamKind;
  /**
   * Primer volcado de texto antes de segmentar (paso 1).
   * Opcional si ya pasaste todo a `dreams[].rawText`.
   */
  rawNarrative?: string;
  /**
   * Vínculos opcionales a “eventos” de vida o calendario (misma API en varios sueños).
   * La app puede resolverlos contra una tabla de eventos aparte.
   */
  relatedLifeEventIds?: string[];
  /** Paso 4 — qué te dejó el sueño, interpretación propia, preguntas. */
  userThought?: string;
  /**
   * Segmentos del relato. Puede ser `[]` en borrador hasta que el usuario añada partes;
   * las reglas de “al menos un segmento” son de validación por `status`, no del tipo.
   */
  dreams: DreamSegment[];
}

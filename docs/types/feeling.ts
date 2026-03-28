/** Etiqueta aproximada del tono afectivo; no excluye mezclas (usar varias o notas). */
export enum FeelingKind {
  Fear = "FEAR",
  Anxiety = "ANXIETY",
  Joy = "JOY",
  Peace = "PEACE",
  Sadness = "SADNESS",
  Anger = "ANGER",
  Shame = "SHAME",
  Guilt = "GUILT",
  Confusion = "CONFUSION",
  Longing = "LONGING",
  Awe = "AWE",
  Disgust = "DISGUST",
  Neutral = "NEUTRAL",
  Mixed = "MIXED",
  Unknown = "UNKNOWN",
}

/** Una emoción o matiz afectivo asociado a un segmento (o a la sesión si lo reutilizas). */
export interface Feeling {
  id: string;
  kind: FeelingKind;
  /** Intensidad subjetiva, p. ej. 0–1 o 1–5; opcional. */
  intensity?: number;
  notes?: string;
}

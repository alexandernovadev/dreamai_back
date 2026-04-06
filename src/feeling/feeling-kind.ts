/**
 * Closed vocabulary for `Feeling.kind`.
 * **Overlap fix:** `Miedo` and `Horror` are merged into `FEAR` (threat / dread / horror + repulsion).
 */
export enum FeelingKind {
  /** Asombro: pequeñez ante lo inmenso o sublime */
  AWE = 'AWE',
  /** Pena (compasión, vergüenza ajena, pesar) */
  PENA = 'PENA',
  BOREDOM = 'BOREDOM',
  CALM = 'CALM',
  CONFUSION = 'CONFUSION',
  /** Anhelo (craving) */
  CRAVING = 'CRAVING',
  DISGUST = 'DISGUST',
  EMPATHIC_PAIN = 'EMPATHIC_PAIN',
  SEXUAL_DESIRE = 'SEXUAL_DESIRE',
  AMUSEMENT = 'AMUSEMENT',
  ENVY = 'ENVY',
  ENTHUSIASM = 'ENTHUSIASM',
  /**
   * Miedo + horror (unificado): amenaza inminente o miedo extremo con repulsión.
   */
  FEAR = 'FEAR',
  INTEREST = 'INTEREST',
  JOY = 'JOY',
  NOSTALGIA = 'NOSTALGIA',
  ROMANCE = 'ROMANCE',
  SADNESS = 'SADNESS',
  SATISFACTION = 'SATISFACTION',
  SYMPATHY = 'SYMPATHY',
  TRIUMPH = 'TRIUMPH',
  ANXIETY = 'ANXIETY',
  ANGER = 'ANGER',
}

export type FeelingKindMeta = {
  labelEs: string;
  descriptionEs: string;
};

export const FEELING_KIND_META: Record<FeelingKind, FeelingKindMeta> = {
  [FeelingKind.AWE]: {
    labelEs: 'Asombro',
    descriptionEs: 'Sensación de pequeñez ante algo inmenso o sublime.',
  },
  [FeelingKind.PENA]: {
    labelEs: 'Pena',
    descriptionEs:
      'Compasión, vergüenza ajena o pesar ante una situación o figura.',
  },
  [FeelingKind.BOREDOM]: {
    labelEs: 'Aburrimiento',
    descriptionEs: 'Falta de interés o estímulo.',
  },
  [FeelingKind.CALM]: {
    labelEs: 'Calma',
    descriptionEs: 'Tranquilidad y paz interior.',
  },
  [FeelingKind.CONFUSION]: {
    labelEs: 'Confusión',
    descriptionEs: 'Incertidumbre o falta de claridad mental.',
  },
  [FeelingKind.CRAVING]: {
    labelEs: 'Anhelo',
    descriptionEs: 'Deseo intenso por algo o alguien.',
  },
  [FeelingKind.DISGUST]: {
    labelEs: 'Asco',
    descriptionEs: 'Rechazo físico o moral ante algo desagradable.',
  },
  [FeelingKind.EMPATHIC_PAIN]: {
    labelEs: 'Dolor empático',
    descriptionEs: 'Sentir el sufrimiento de otra persona.',
  },
  [FeelingKind.SEXUAL_DESIRE]: {
    labelEs: 'Deseo sexual',
    descriptionEs: 'Atracción física e impulso erótico.',
  },
  [FeelingKind.AMUSEMENT]: {
    labelEs: 'Diversión',
    descriptionEs: 'Algo gracioso o entretenido.',
  },
  [FeelingKind.ENVY]: {
    labelEs: 'Envidia',
    descriptionEs: 'Desear lo que otro tiene o malestar por su éxito.',
  },
  [FeelingKind.ENTHUSIASM]: {
    labelEs: 'Entusiasmo',
    descriptionEs: 'Energía positiva por algo que viene.',
  },
  [FeelingKind.FEAR]: {
    labelEs: 'Miedo / horror',
    descriptionEs:
      'Amenaza o peligro inminente, o miedo extremo con repulsión (antes “Miedo” y “Horror” por separado).',
  },
  [FeelingKind.INTEREST]: {
    labelEs: 'Interés',
    descriptionEs: 'Curiosidad y ganas de aprender o explorar.',
  },
  [FeelingKind.JOY]: {
    labelEs: 'Alegría',
    descriptionEs: 'Bienestar y satisfacción.',
  },
  [FeelingKind.NOSTALGIA]: {
    labelEs: 'Nostalgia',
    descriptionEs: 'Anhelo sentimental por el pasado.',
  },
  [FeelingKind.ROMANCE]: {
    labelEs: 'Romance',
    descriptionEs: 'Amor y conexión afectiva (no solo sexual).',
  },
  [FeelingKind.SADNESS]: {
    labelEs: 'Tristeza',
    descriptionEs: 'Ánimo bajo por pérdida o desilusión.',
  },
  [FeelingKind.SATISFACTION]: {
    labelEs: 'Satisfacción',
    descriptionEs: 'Plenitud con lo logrado o con lo que se tiene.',
  },
  [FeelingKind.SYMPATHY]: {
    labelEs: 'Simpatía',
    descriptionEs: 'Compasión y comprensión hacia los demás.',
  },
  [FeelingKind.TRIUMPH]: {
    labelEs: 'Triunfo',
    descriptionEs: 'Euforia por haber superado un reto.',
  },
  [FeelingKind.ANXIETY]: {
    labelEs: 'Ansiedad',
    descriptionEs:
      'Preocupación o nerviosismo por el futuro (distinto de amenaza inminente → usar Miedo).',
  },
  [FeelingKind.ANGER]: {
    labelEs: 'Ira',
    descriptionEs: 'Enfado o indignación.',
  },
};

export function listFeelingKinds(): Array<{
  kind: FeelingKind;
  labelEs: string;
  descriptionEs: string;
}> {
  return (Object.values(FeelingKind) as FeelingKind[]).map((kind) => ({
    kind,
    ...FEELING_KIND_META[kind],
  }));
}

/** Valores alineados al modelo persistido en MongoDB (DTOs y esquemas Mongoose). */

export enum DreamSessionStatus {
  DRAFT = 'DRAFT',
  REFINING = 'REFINING',
  STRUCTURED = 'STRUCTURED',
  REFLECTIONS_DONE = 'REFLECTIONS_DONE',
}

export enum DreamKind {
  NIGHTMARE = 'NIGHTMARE',
  ORDINARY = 'ORDINARY',
  FANTASY = 'FANTASY',
  LUCID = 'LUCID',
  ANXIOUS = 'ANXIOUS',
  SURREAL = 'SURREAL',
  RECURRENT = 'RECURRENT',
  MIXED = 'MIXED',
  UNKNOWN = 'UNKNOWN',
}

export enum Archetype {
  SHADOW = 'SHADOW',
  ANIMA_ANIMUS = 'ANIMA_ANIMUS',
  WISE_FIGURE = 'WISE_FIGURE',
  PERSONA = 'PERSONA',
  UNKNOWN = 'UNKNOWN',
}

export enum LocationSetting {
  URBAN = 'URBAN',
  NATURE = 'NATURE',
  INDOOR = 'INDOOR',
  ABSTRACT = 'ABSTRACT',
}

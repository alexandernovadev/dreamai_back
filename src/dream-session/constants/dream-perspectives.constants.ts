/**
 * Valores permitidos en `analysis.perspectives` (API + app).
 * Solo dos perspectivas: participar en el sueño como actor y/o observarlo desde fuera.
 * Mantener alineado con `dreamai_app/services/dreamPerspectives.ts`.
 */
export const DREAM_PERSPECTIVE_VALUES = ['ACTOR', 'OBSERVER'] as const;

export type DreamPerspectiveValue =
  (typeof DREAM_PERSPECTIVE_VALUES)[number];

/**
 * Evento de vida o calendario (API `/life-events`).
 * Las sesiones de sueño referencian filas de esta entidad vía `relatedLifeEventIds` (solo ids).
 */
export interface LifeEvent {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  title: string;
  note?: string;
  /** Fecha/hora del hecho, si la registrás. */
  occurredAt?: Date;
}

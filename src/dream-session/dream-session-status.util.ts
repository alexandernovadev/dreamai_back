import { DreamSessionStatus } from './schemas/dream-session.schema';

const ORDER: Record<DreamSessionStatus, number> = {
  [DreamSessionStatus.DRAFT]: 0,
  [DreamSessionStatus.ELEMENTS]: 1,
  [DreamSessionStatus.STRUCTURED]: 2,
  [DreamSessionStatus.THOUGHT]: 3,
};

/**
 * Regla de negocio: el flujo del sueño es **solo hacia adelante** (borrador → elementos →
 * detalle → reflexión). Si el usuario vuelve a un paso anterior y guarda, el cliente puede
 * enviar un `status` de una fase previa; aquí tomamos el **máximo** entre lo ya persistido y
 * lo pedido, para no rebajar la fase alcanzada.
 */
export function maxDreamSessionStatus(
  current: DreamSessionStatus,
  requested: DreamSessionStatus,
): DreamSessionStatus {
  return ORDER[current] >= ORDER[requested] ? current : requested;
}

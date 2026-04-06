import { Types } from 'mongoose';

/**
 * Convierte cualquier referencia de Mongoose (ObjectId, string, objeto con .toString)
 * a su representación hexadecimal string. Retorna `null` si el valor no es un ObjectId válido.
 */
export function refToIdHex(v: unknown): string | null {
  if (v == null) return null;
  const s =
    typeof v === 'string'
      ? v
      : typeof (v as { toString?: () => string }).toString === 'function'
        ? (v as { toString: () => string }).toString()
        : String(v);
  const t = s.trim();
  if (!t || !Types.ObjectId.isValid(t)) return null;
  return new Types.ObjectId(t).toString();
}

/**
 * Convierte cualquier valor a string usando `.toString()` si está disponible.
 * A diferencia de `refToIdHex`, no valida que sea un ObjectId.
 */
export function idStr(v: unknown): string {
  if (
    v != null &&
    typeof (v as { toString?: () => string }).toString === 'function'
  ) {
    return String((v as { toString: () => string }).toString());
  }
  return String(v);
}

/**
 * Filtra y deduplica una lista de valores, retornando solo los que son ObjectIds válidos
 * como strings únicos.
 */
export function uniqValidObjectIds(ids: unknown[]): string[] {
  const set = new Set<string>();
  for (const x of ids) {
    const s = typeof x === 'string' ? x : x != null ? String(x) : null;
    if (s && Types.ObjectId.isValid(s)) set.add(s);
  }
  return [...set];
}

/**
 * Construye un Record<string, T> a partir de un array de documentos.
 * El caller provee la función que extrae la clave y el valor de cada documento.
 */
export function mapById<T>(
  docs: Array<Record<string, unknown>>,
  pair: (d: Record<string, unknown>) => [string, T],
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const d of docs) {
    const [k, v] = pair(d);
    out[k] = v;
  }
  return out;
}

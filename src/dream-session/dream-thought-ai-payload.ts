import type { HydratedDreamSessionPayload } from './dream-session-hydrated.types';

type HydratedMaps = HydratedDreamSessionPayload['hydrated'];

function refId(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  return String(v);
}

/**
 * Contexto para lectura onírica: sin documento `session` ni IDs de Mongo.
 * `hydrated` son listas en el mismo orden que `analysis.entities`.
 */
export function buildThoughtReadingContextPayload(
  session: unknown,
  hydrated: HydratedMaps,
): Record<string, unknown> {
  const s = session as Record<string, unknown>;
  const narrative =
    typeof s.rawNarrative === 'string' ? s.rawNarrative.trim() : '';

  const userThought =
    typeof s.userThought === 'string' && s.userThought.trim() !== ''
      ? s.userThought.trim()
      : undefined;

  const dreamKind = Array.isArray(s.dreamKind)
    ? (s.dreamKind as unknown[]).filter(
        (x): x is string => typeof x === 'string',
      )
    : [];

  const analysis = s.analysis as Record<string, unknown> | undefined;
  const perspectives = Array.isArray(analysis?.perspectives)
    ? (analysis.perspectives as unknown[]).filter(
        (x): x is string => typeof x === 'string',
      )
    : [];
  const lucidityLevel =
    typeof analysis?.lucidityLevel === 'number'
      ? analysis.lucidityLevel
      : undefined;

  const entities = analysis?.entities as Record<string, unknown> | undefined;

  const out: Record<string, unknown> = {
    narrative,
    hydrated: {
      characters: ordered(
        entities?.characters,
        (r) => refId((r as Record<string, unknown>).characterId),
        (id) => hydrated.characters[id],
        (h) => stripNameWithDescription(h),
      ),
      locations: ordered(
        entities?.locations,
        (r) => refId((r as Record<string, unknown>).locationId),
        (id) => hydrated.locations[id],
        (h) => stripNameWithDescription(h),
      ),
      objects: ordered(
        entities?.objects,
        (r) => refId((r as Record<string, unknown>).objectId),
        (id) => hydrated.objects[id],
        (h) => stripNameWithDescription(h),
      ),
      contextLife: ordered(
        entities?.contextLife,
        (r) => refId((r as Record<string, unknown>).contextLifeId),
        (id) => hydrated.contextLife[id],
        (h) => {
          const row: { title: string; description?: string } = {
            title: h.title,
          };
          if (h.description !== undefined && h.description.trim() !== '') {
            row.description = h.description;
          }
          return row;
        },
      ),
      events: ordered(
        entities?.events,
        (r) => refId((r as Record<string, unknown>).eventId),
        (id) => hydrated.events[id],
        (h) => stripLabelWithDescription(h),
      ),
      feelings: ordered(
        entities?.feelings,
        (r) => refId((r as Record<string, unknown>).feelingId),
        (id) => hydrated.feelings[id],
        (h) => {
          const row: {
            kind: string;
            intensity?: number;
            notes?: string;
          } = { kind: h.kind };
          if (h.intensity !== undefined && h.intensity !== null) {
            row.intensity = h.intensity;
          }
          if (
            h.notes !== undefined &&
            h.notes !== null &&
            String(h.notes).trim() !== ''
          ) {
            row.notes = String(h.notes);
          }
          return row;
        },
      ),
    },
  };

  if (userThought !== undefined) out.userThought = userThought;
  if (dreamKind.length > 0) out.dreamKind = dreamKind;
  if (perspectives.length > 0) out.perspectives = perspectives;
  if (lucidityLevel !== undefined) out.lucidityLevel = lucidityLevel;

  return out;
}

function ordered<TRef, THydrated>(
  refs: unknown,
  getId: (row: unknown) => string | null,
  lookup: (id: string) => THydrated | undefined,
  strip: (h: THydrated) => Record<string, unknown>,
): Record<string, unknown>[] {
  if (!Array.isArray(refs)) return [];
  const acc: Record<string, unknown>[] = [];
  for (const r of refs) {
    const id = getId(r);
    if (!id) continue;
    const h = lookup(id);
    if (!h) continue;
    acc.push(strip(h));
  }
  return acc;
}

function stripNameWithDescription(h: {
  name: string;
  description?: string;
}): Record<string, unknown> {
  const row: { name: string; description?: string } = { name: h.name };
  if (h.description !== undefined && String(h.description).trim() !== '') {
    row.description = String(h.description).slice(0, 5000);
  }
  return row;
}

function stripLabelWithDescription(h: {
  label: string;
  description?: string;
}): Record<string, unknown> {
  const row: { label: string; description?: string } = { label: h.label };
  if (h.description !== undefined && String(h.description).trim() !== '') {
    row.description = String(h.description).slice(0, 5000);
  }
  return row;
}

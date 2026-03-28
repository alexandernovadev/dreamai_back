/**
 * Recorre `DreamSegment[]` en JSON y acumula ids de catálogo referenciados en entidades.
 * Segmentos JSON: catalogCharacterId, catalogObjectId, catalogLocationId (opcional en Location).
 */
export function extractCatalogIdsFromDreamsJson(dreams: unknown): {
  catalogCharacterIds: string[];
  catalogLocationIds: string[];
  catalogObjectIds: string[];
} {
  const characterIds = new Set<string>();
  const locationIds = new Set<string>();
  const objectIds = new Set<string>();

  if (!Array.isArray(dreams)) {
    return {
      catalogCharacterIds: [],
      catalogLocationIds: [],
      catalogObjectIds: [],
    };
  }

  for (const segment of dreams) {
    if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
      continue;
    }
    const analysis = (segment as { analysis?: unknown }).analysis;
    if (!analysis || typeof analysis !== 'object' || analysis === null) {
      continue;
    }
    const entities = (analysis as { entities?: unknown }).entities;
    if (!entities || typeof entities !== 'object' || entities === null) {
      continue;
    }
    const e = entities as {
      characters?: unknown;
      locations?: unknown;
      objects?: unknown;
    };

    if (Array.isArray(e.characters)) {
      for (const ch of e.characters) {
        if (ch && typeof ch === 'object' && !Array.isArray(ch)) {
          const id = (ch as { catalogCharacterId?: unknown })
            .catalogCharacterId;
          if (typeof id === 'string' && id.length > 0) {
            characterIds.add(id);
          }
        }
      }
    }
    if (Array.isArray(e.locations)) {
      for (const loc of e.locations) {
        if (loc && typeof loc === 'object' && !Array.isArray(loc)) {
          const id = (loc as { catalogLocationId?: unknown }).catalogLocationId;
          if (typeof id === 'string' && id.length > 0) {
            locationIds.add(id);
          }
        }
      }
    }
    if (Array.isArray(e.objects)) {
      for (const obj of e.objects) {
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          const id = (obj as { catalogObjectId?: unknown }).catalogObjectId;
          if (typeof id === 'string' && id.length > 0) {
            objectIds.add(id);
          }
        }
      }
    }
  }

  return {
    catalogCharacterIds: [...characterIds],
    catalogLocationIds: [...locationIds],
    catalogObjectIds: [...objectIds],
  };
}

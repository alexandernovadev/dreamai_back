/** Labels mínimos para hidratar el paso Elementos (un solo GET). */
export type HydratedDreamSessionPayload = {
  session: unknown;
  hydrated: {
    characters: Record<string, { id: string; name: string }>;
    locations: Record<string, { id: string; name: string }>;
    objects: Record<string, { id: string; name: string }>;
    contextLife: Record<string, { id: string; title: string }>;
    events: Record<string, { id: string; label: string }>;
    feelings: Record<
      string,
      { id: string; kind: string; intensity?: number; notes?: string }
    >;
  };
};

/** Respuesta de `POST /dream-sessions/:id/ai/suggest-thought`. */
export type DreamThoughtSuggestResponse = {
  schemaVersion: 1;
  dreamSessionId: string;
  suggestion: string;
};

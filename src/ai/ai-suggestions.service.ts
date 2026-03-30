import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  SuggestDreamElementsResult,
  SuggestThoughtReadingResult,
  SuggestedArchetype,
  SuggestedCharacter,
  SuggestedDreamEvent,
  SuggestedDreamObject,
  SuggestedLocation,
  SuggestedLocationSetting,
} from './ai-suggestions.types';

const ARCHETYPES: readonly SuggestedArchetype[] = [
  'SHADOW',
  'ANIMA_ANIMUS',
  'WISE_FIGURE',
  'PERSONA',
  'UNKNOWN',
];

const SETTINGS: readonly SuggestedLocationSetting[] = [
  'URBAN',
  'NATURE',
  'INDOOR',
  'ABSTRACT',
];

const DREAM_ELEMENTS_SYSTEM_PROMPT = `You extract structured elements from a dream narrative for a journaling app.
Return ONLY valid JSON with this exact shape (no markdown, no commentary):
{
  "characters": [
    {
      "name": "short label",
      "description": "1-3 sentences: who they are in the dream",
      "isKnown": true or false (whether the dreamer would recognize them as someone from waking life),
      "archetype": "SHADOW" | "ANIMA_ANIMUS" | "WISE_FIGURE" | "PERSONA" | "UNKNOWN",
      "confidence": 0.0 to 1.0 (how sure this is a distinct figure worth cataloguing)
    }
  ],
  "locations": [
    {
      "name": "short label",
      "description": "1-3 sentences",
      "isFamiliar": true or false (feels like a known place vs wholly dreamlike),
      "setting": "URBAN" | "NATURE" | "INDOOR" | "ABSTRACT",
      "confidence": 0.0 to 1.0
    }
  ],
  "objects": [
    {
      "name": "short label",
      "description": "optional",
      "confidence": 0.0 to 1.0
    }
  ],
  "events": [
    {
      "label": "short label for a plot beat or happening inside the dream (not a waking-life calendar event)",
      "description": "optional",
      "confidence": 0.0 to 1.0
    }
  ]
}
Rules:
- Do NOT output emotions, moods, or a "feelings" array. Skip inner feelings as entities.
- Do NOT output waking-life context labels (work, family, projects, health themes as separate items); only label dream figures, places, objects, and in-dream happenings.
- Do not interpret the dream therapeutically; only label entities, places, objects, and in-dream happenings.
- Omit empty arrays if nothing fits; use [] not null.
- Keep names concise; descriptions in the same language as the narrative unless locale asks otherwise.`;

const THOUGHT_READING_PROMPT = `You write one advanced oneiric reading (dream scholarship / oneirology style): interpretive prose, not a summary, not therapy, not clinical or psychological counselling, not self-help "suggestions" or homework.

The user message is a JSON object. It contains:
- "narrative": the dream text (required).
- Optional: "userThought", "dreamKind", "perspectives", "lucidityLevel".
- "hydrated": ordered lists (each item includes a name/label/title and, when present in the catalog, "description"): "characters", "locations", "objects", "contextLife" (waking-life contexts), "events" (in-dream happenings), "feelings". Order matches how the dreamer linked them. Empty arrays mean nothing was linked.

Waking life (vigilia): use hydrated.contextLife as real-life contexts the dreamer associated with this dream. Integrate with dream imagery when warranted.

Use expert dream-reading approaches (symbolic, narrative, thematic). Offer interpretive possibilities as approximate readings, not absolute truth. Do not diagnose or treat. Do not write imperatives like "you should" or therapeutic prescriptions.

Return ONLY valid JSON with this exact shape (no markdown, no commentary):
{
  "reading": "<your reading in prose>"
}
Rules:
- Match the output language to the locale hint when present; otherwise match the narrative language.
- Several paragraphs as needed; no bullet lists inside the string unless the narrative style calls for it.
- If hydrated.contextLife is empty, do not invent waking-life events.`;

@Injectable()
export class AiSuggestionsService {
  /**
   * Extracción ampliada para el paso Elementos: incluye eventos oníricos (no contexto vital).
   * No persiste; el emparejado con catálogo ocurre en `DreamElementsAiService`.
   */
  suggestDreamElements(
    text: string,
    locale?: string,
  ): Promise<SuggestDreamElementsResult> {
    const apiKey =
      process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI suggestions are not configured (set AI_API_KEY or OPENAI_API_KEY).',
      );
    }
    const model = process.env.AI_MODEL?.trim() || 'deepseek-chat';
    const baseUrl = (
      process.env.AI_BASE_URL?.trim() || 'https://api.deepseek.com/v1'
    ).replace(/\/$/, '');

    const userContent =
      (locale ? `Locale hint for output language: ${locale}\n\n---\n\n` : '') +
      text.trim();

    return this.callOpenAiCompatible({
      apiKey,
      model,
      baseUrl,
      userContent,
      systemPrompt: DREAM_ELEMENTS_SYSTEM_PROMPT,
      normalize: normalizeSuggestDreamElements,
      temperature: 0.3,
    });
  }

  /**
   * Lectura onírica avanzada: objeto completo `{ session, hydrated }` (catálogo resuelto, incl. contextLife).
   */
  suggestThoughtReading(
    contextPayload: Record<string, unknown>,
    locale?: string,
  ): Promise<SuggestThoughtReadingResult> {
    const apiKey =
      process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI suggestions are not configured (set AI_API_KEY or OPENAI_API_KEY).',
      );
    }
    const model = process.env.AI_MODEL?.trim() || 'deepseek-chat';
    const baseUrl = (
      process.env.AI_BASE_URL?.trim() || 'https://api.deepseek.com/v1'
    ).replace(/\/$/, '');

    console.log('contextPayload', JSON.stringify(contextPayload, null, 2));

    const userContent =
      (locale ? `Locale hint for output language: ${locale}\n\n---\n\n` : '') +
      'Dream context (JSON, no database ids):\n\n' +
      JSON.stringify(contextPayload);

    return this.callOpenAiCompatible({
      apiKey,
      model,
      baseUrl,
      userContent,
      systemPrompt: THOUGHT_READING_PROMPT,
      normalize: normalizeSuggestThoughtReading,
      temperature: 0.45,
    });
  }

  private async callOpenAiCompatible<T>(opts: {
    apiKey: string;
    model: string;
    baseUrl: string;
    userContent: string;
    systemPrompt: string;
    normalize: (data: unknown) => T;
    temperature?: number;
  }): Promise<T> {
    const temperature = opts.temperature ?? 0.3;
    const res = await fetch(`${opts.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: opts.systemPrompt },
          { role: 'user', content: opts.userContent },
        ],
      }),
    });

    const raw = (await res.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!res.ok) {
      const msg = raw.error?.message ?? res.statusText;
      throw new BadGatewayException(
        `AI provider error (${res.status}): ${msg}`,
      );
    }

    const content = raw.choices?.[0]?.message?.content;
    if (!content) {
      throw new BadGatewayException('AI provider returned no message content.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      throw new BadGatewayException('AI returned invalid JSON.');
    }

    return opts.normalize(parsed);
  }
}

function normalizeCharacters(v: unknown): SuggestedCharacter[] {
  if (!Array.isArray(v)) return [];
  const out: SuggestedCharacter[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const x = item as Record<string, unknown>;
    const name = typeof x.name === 'string' ? x.name.trim() : '';
    const description =
      typeof x.description === 'string' ? x.description.trim() : '';
    if (!name || !description) continue;
    const row: SuggestedCharacter = {
      name: name.slice(0, 200),
      description: description.slice(0, 2000),
      isKnown: Boolean(x.isKnown),
      archetype: coerceArchetype(x.archetype),
    };
    const c = coerceConfidence(x.confidence);
    if (c !== undefined) row.confidence = c;
    out.push(row);
  }
  return out;
}

function normalizeLocations(v: unknown): SuggestedLocation[] {
  if (!Array.isArray(v)) return [];
  const out: SuggestedLocation[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const x = item as Record<string, unknown>;
    const name = typeof x.name === 'string' ? x.name.trim() : '';
    const description =
      typeof x.description === 'string' ? x.description.trim() : '';
    if (!name || !description) continue;
    const row: SuggestedLocation = {
      name: name.slice(0, 200),
      description: description.slice(0, 2000),
      isFamiliar: Boolean(x.isFamiliar),
      setting: coerceSetting(x.setting),
    };
    const c = coerceConfidence(x.confidence);
    if (c !== undefined) row.confidence = c;
    out.push(row);
  }
  return out;
}

function normalizeObjects(v: unknown): SuggestedDreamObject[] {
  if (!Array.isArray(v)) return [];
  const out: SuggestedDreamObject[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const x = item as Record<string, unknown>;
    const name = typeof x.name === 'string' ? x.name.trim() : '';
    if (!name) continue;
    const description =
      typeof x.description === 'string' ? x.description.trim() : undefined;
    const row: SuggestedDreamObject = {
      name: name.slice(0, 200),
      description: description ? description.slice(0, 2000) : undefined,
    };
    const c = coerceConfidence(x.confidence);
    if (c !== undefined) row.confidence = c;
    out.push(row);
  }
  return out;
}

function normalizeSuggestDreamElements(
  data: unknown,
): SuggestDreamElementsResult {
  if (!data || typeof data !== 'object') {
    return emptyDreamElementsResult();
  }
  const o = data as Record<string, unknown>;
  return {
    characters: normalizeCharacters(o.characters),
    locations: normalizeLocations(o.locations),
    objects: normalizeObjects(o.objects),
    events: normalizeDreamEvents(o.events),
  };
}

function emptyDreamElementsResult(): SuggestDreamElementsResult {
  return {
    characters: [],
    locations: [],
    objects: [],
    events: [],
  };
}

function normalizeDreamEvents(v: unknown): SuggestedDreamEvent[] {
  if (!Array.isArray(v)) return [];
  const out: SuggestedDreamEvent[] = [];
  for (const item of v) {
    if (!item || typeof item !== 'object') continue;
    const x = item as Record<string, unknown>;
    const label = typeof x.label === 'string' ? x.label.trim() : '';
    if (!label) continue;
    const description =
      typeof x.description === 'string' ? x.description.trim() : undefined;
    const row: SuggestedDreamEvent = {
      label: label.slice(0, 500),
      description: description ? description.slice(0, 2000) : undefined,
    };
    const c = coerceConfidence(x.confidence);
    if (c !== undefined) row.confidence = c;
    out.push(row);
  }
  return out;
}

function coerceConfidence(v: unknown): number | undefined {
  if (typeof v !== 'number' || Number.isNaN(v)) return undefined;
  return Math.min(1, Math.max(0, v));
}

function coerceArchetype(v: unknown): SuggestedArchetype {
  if (typeof v !== 'string') return 'UNKNOWN';
  const u = v.trim().toUpperCase().replace(/-/g, '_');
  return ARCHETYPES.includes(u as SuggestedArchetype)
    ? (u as SuggestedArchetype)
    : 'UNKNOWN';
}

function coerceSetting(v: unknown): SuggestedLocationSetting {
  if (typeof v !== 'string') return 'ABSTRACT';
  const u = v.trim().toUpperCase();
  return SETTINGS.includes(u as SuggestedLocationSetting)
    ? (u as SuggestedLocationSetting)
    : 'ABSTRACT';
}

function normalizeSuggestThoughtReading(
  data: unknown,
): SuggestThoughtReadingResult {
  if (!data || typeof data !== 'object') {
    return { reading: '' };
  }
  const o = data as Record<string, unknown>;
  const raw =
    typeof o.reading === 'string'
      ? o.reading.trim()
      : typeof o.text === 'string'
        ? o.text.trim()
        : '';
  return { reading: raw.slice(0, 50_000) };
}

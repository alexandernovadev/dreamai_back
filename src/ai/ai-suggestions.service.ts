import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type {
  SuggestEntitiesResult,
  SuggestedArchetype,
  SuggestedCharacter,
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

const SYSTEM_PROMPT = `You extract entities from a dream narrative for a journaling app.
Return ONLY valid JSON with this exact shape (no markdown, no commentary):
{
  "characters": [
    {
      "name": "short label",
      "description": "1-3 sentences: who they are in the dream",
      "isKnown": true or false (whether the dreamer would recognize them as someone from waking life),
      "archetype": "SHADOW" | "ANIMA_ANIMUS" | "WISE_FIGURE" | "PERSONA" | "UNKNOWN",
      "quote": "optional short verbatim excerpt from the user's text"
    }
  ],
  "locations": [
    {
      "name": "short label",
      "description": "1-3 sentences",
      "isFamiliar": true or false (feels like a known place vs wholly dreamlike),
      "setting": "URBAN" | "NATURE" | "INDOOR" | "ABSTRACT",
      "quote": "optional excerpt"
    }
  ],
  "objects": [
    {
      "name": "short label",
      "description": "optional",
      "quote": "optional excerpt"
    }
  ]
}
Rules:
- Do not interpret the dream therapeutically; only label entities and settings.
- Omit empty arrays if nothing fits; use [] not null.
- Keep names concise; descriptions in the same language as the narrative unless locale asks otherwise.`;

@Injectable()
export class AiSuggestionsService {
  suggestEntities(
    text: string,
    locale?: string,
  ): Promise<SuggestEntitiesResult> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI suggestions are not configured (set OPENAI_API_KEY).',
      );
    }
    const model = process.env.AI_MODEL?.trim() || 'gpt-4o-mini';
    const baseUrl = (
      process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1'
    ).replace(/\/$/, '');

    const userContent =
      (locale ? `Locale hint for output language: ${locale}\n\n---\n\n` : '') +
      text.trim();

    return this.callOpenAiCompatible({
      apiKey,
      model,
      baseUrl,
      userContent,
    });
  }

  private async callOpenAiCompatible(opts: {
    apiKey: string;
    model: string;
    baseUrl: string;
    userContent: string;
  }): Promise<SuggestEntitiesResult> {
    const res = await fetch(`${opts.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
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

    return normalizeSuggestEntities(parsed);
  }
}

function normalizeSuggestEntities(data: unknown): SuggestEntitiesResult {
  if (!data || typeof data !== 'object') {
    return emptyResult();
  }
  const o = data as Record<string, unknown>;
  return {
    characters: normalizeCharacters(o.characters),
    locations: normalizeLocations(o.locations),
    objects: normalizeObjects(o.objects),
  };
}

function emptyResult(): SuggestEntitiesResult {
  return { characters: [], locations: [], objects: [] };
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
    out.push({
      name: name.slice(0, 200),
      description: description.slice(0, 2000),
      isKnown: Boolean(x.isKnown),
      archetype: coerceArchetype(x.archetype),
      quote: optionalQuote(x.quote),
    });
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
    out.push({
      name: name.slice(0, 200),
      description: description.slice(0, 2000),
      isFamiliar: Boolean(x.isFamiliar),
      setting: coerceSetting(x.setting),
      quote: optionalQuote(x.quote),
    });
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
    out.push({
      name: name.slice(0, 200),
      description: description ? description.slice(0, 2000) : undefined,
      quote: optionalQuote(x.quote),
    });
  }
  return out;
}

function optionalQuote(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return t.slice(0, 500);
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

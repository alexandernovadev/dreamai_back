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
- Do NOT output waking-life context labels (work, family, projects, health themes as separate items); only label dream figures,
 places, objects, and in-dream happenings.
- Do not interpret the dream therapeutically; only label entities, places, objects, and in-dream happenings.
- Omit empty arrays if nothing fits; use [] not null.
- Keep names concise; descriptions in the same language as the narrative unless locale asks otherwise.`;

const THOUGHT_READING_PROMPT = `You produce an INTERPRETATION of what this dream may mean or express — not a summary, 
not a paraphrase, not a retelling of the plot. Do not open with "In this dream…" to recount events; at most a short anchor,
 then move to meaning: motives, tensions, symbols, emotional charge, possible echoes of waking life.

Style: advanced oneiric interpretation (symbolic, narrative, archetypal, thematic). Multiple hypotheses are 
welcome ("one reading might be…", "another layer could be…"). The point is sense-making and plausible significance, 
not compressing the story into fewer words.

The user message is a JSON object:
- "narrative": the dream text (required).
- Optional: "userThought", "dreamKind", "perspectives", "lucidityLevel".
- "hydrated": ordered lists with names/labels/titles and optional "description" for characters, locations, objects, 
contextLife (waking-life contexts), in-dream events, feelings. Order reflects how the dreamer linked them.

Waking life: hydrated.contextLife is what the dreamer tied to this dream in vigil — use it to explore bridges between 
life circumstances and dream imagery when relevant. Do not invent waking-life facts not present in the JSON.

Hard limits: not therapy, not diagnosis, not medical or psychological treatment advice, no "you should" prescriptions. 
No clinical labels.

Return ONLY valid JSON (no markdown):
{
  "reading": "<interpretive prose — what it might mean, not a synopsis>"
}
Rules:
- Output language: follow the locale hint when present; else match the narrative language.
- Several paragraphs; avoid bullet lists inside the string unless essential.
- If hydrated.contextLife is empty, do not fabricate waking-life events.`;

const RECENT_DREAMS_SUMMARY_PROMPT = `You analyze several recent dreams from the same person. Each item in "dreams" is 
one dream: "narrative" plus optional "hydrated" (characters, locations, objects, contextLife, events, feelings). 
Cross-dream pattern work: curious and literary, not clinical therapy.

**Task scope (critical):** This is **cross-dream / multi-night pattern synthesis** — you compare 
**several separate nights** and name what **recurs across them**. It is **not** the same task as 
interpreting **one** isolated dream in depth, and it is **not** fortune-telling or predicting the future. 
If you mention a single night, do so only as an example within the batch. Make the distinction explicit 
early in the Markdown: patterns over a **period** vs. what would matter for **one** dream alone.

Voice: warm, curious, gently oneiric — short metaphors are welcome to link images across dreams. Avoid cold 
lists with no texture; avoid therapist or diagnostic tone. Frame recurring motifs as **hypotheses** 
("podría…", "un hilo posible…"), never as fate, verdicts, or certainty.

Return ONLY valid JSON. The outer message is JSON; the "summary" field value MUST be a Markdown string 
(escape quotes and newlines so the JSON is valid).

{
  "summary": "<Markdown: ## section headings, paragraphs, - bullets, **bold** for emphasis.>"
}

Inside "summary", use Markdown and structure these sections **in order** (Spanish titles below; translate 
headings if the output language is not Spanish):

## Ecos y repetición
- Bullet lines. What returns most insistently across dreams: figures, places, moods, actions, objects. 
Use **bold** for the strongest echoes vs lighter ones where helpful.

## Variaciones
One short paragraph (or two): how the same motif shifts from dream to dream. If almost no variation, say so briefly.

## Por qué podría repetirse
2–4 short paragraphs or compact bullets: grounded in the JSON only — plausible **why** these elements 
cluster (emotional pressure, unresolved motif, life-theme bridges *only if* supported by narratives or 
hydrated.contextLife). This is analysis, not certainty: frame as hypotheses 
("podría deberse a…", "un hilo posible es…"). Do not invent waking-life events; if data is thin,
 say the repetition is strong but the "why" remains open.

## Tensión o pregunta viva
1–3 sentences: what seems symbolically or emotionally at stake — hypotheses, not verdicts.

## Puente con la vigilia
Only from hydrated.contextLife and narrative cues. If links are thin or absent, say so in one sentence; 
do not invent circumstances.

## Señales para reconocer el patrón al soñar
Practical, non-prescriptive bullets: what the dreamer could **notice while dreaming** (or at the edge of sleep) 
to tell whether the current dream is riding the **same repeating threads** as before — e.g. recurring figures, 
settings, emotional tone, or actions to compare. Not sleep hygiene or "what to do before bed"; 
focus on **recognition** of the pattern *inside* dream experience. No commands; no "debes".

## Lucidez mínima (opcional, breve)
At most **one or two** short bullets total: if the **same motif** seems to echo in **waking life** after 
appearing across dreams, suggest **one** low-friction **reality-check** the person could try as a 
**personal experiment** (e.g. reading text twice, asking "¿estoy soñando?" once) — framed as optional, 
not medical, not a guarantee of lucid dreaming. Skip this subsection entirely if nothing in the JSON supports it.

## Síntesis final
One **coherent paragraph** (not a slogan, not a poetic one-liner): a sober closing summary of the whole 
picture — main echoes, why they might matter, and the recognition angle — as if closing a short report. 
No blockquotes required; no forced "memorable" flourish.

Do not wrap the whole summary in a code fence. No HTML tags.

Hard limits: no clinical diagnosis, no medical or psychological treatment advice, no "you must" / "tienes que".
 No prophecy, no deterministic predictions. Do not invent waking-life facts not present in the JSON.

If a dream entry is sparse, still use what is there; do not fabricate plot.

Output language: follow the locale hint when present; otherwise match the dominant narrative language. 
Section headings must be in that same language.`;

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
    const { apiKey, model, baseUrl } = this.resolveAiConfig();

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
    const { apiKey, model, baseUrl } = this.resolveAiConfig();

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

  /** Patrones entre los últimos sueños (solo lectura; no persiste). */
  suggestRecentDreamsSummary(
    dreams: Record<string, unknown>[],
    locale?: string,
  ): Promise<{ summary: string }> {
    const { apiKey, model, baseUrl } = this.resolveAiConfig();

    const payload = { dreams };
    const userContent =
      (locale ? `Locale hint for output language: ${locale}\n\n---\n\n` : '') +
      JSON.stringify(payload);

    return this.callOpenAiCompatible({
      apiKey,
      model,
      baseUrl,
      userContent,
      systemPrompt: RECENT_DREAMS_SUMMARY_PROMPT,
      normalize: normalizeRecentDreamsSummary,
      temperature: 0.35,
    });
  }

  private resolveAiConfig(): {
    apiKey: string;
    model: string;
    baseUrl: string;
  } {
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
    return { apiKey, model, baseUrl };
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

function normalizeRecentDreamsSummary(data: unknown): { summary: string } {
  if (!data || typeof data !== 'object') {
    return { summary: '' };
  }
  const o = data as Record<string, unknown>;
  const raw =
    typeof o.summary === 'string'
      ? o.summary.trim()
      : typeof o.text === 'string'
        ? o.text.trim()
        : '';
  return { summary: raw.slice(0, 100_000) };
}

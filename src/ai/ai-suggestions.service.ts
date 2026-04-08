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

const THOUGHT_READING_PROMPT = `
You produce an INTERPRETATION of what this dream may mean or express — not a summary, 
not a paraphrase, not a retelling of the plot. Do not open with "In this dream…" to recount events; 
at most a minimal anchor, then move quickly into meaning: tensions, symbols, emotional charge, and possible links to waking life.

---

## INTERNAL ANALYSIS (do not output directly)

Before writing:

1. Identify the **core symbolic nucleus**:
   - the 1–2 most emotionally or narratively dominant elements (image, character, action, or tension)

2. Identify supporting elements:
   - secondary symbols that reinforce or contrast the core

3. Detect emotional structure:
   - what shifts, intensifies, or repeats inside the dream

4. Discard generic interpretations:
   - if a statement could apply to almost any dream, do not use it

Only after this, write the interpretation centered on the core nucleus.

---

## INTERPRETATION RULES

- Focus on **depth over breadth**
- Limit to **2–3 strong interpretations**, not many weak ones

- Each interpretation must:
  - explicitly reference concrete elements from the dream
  - explain *why* those elements support that reading

- You MAY form strong interpretations if the symbolic structure is clear

- Avoid vague archetypes unless grounded in specific details

- Do NOT invent waking-life facts
- Use hydrated.contextLife only when clearly relevant
- If no strong interpretation emerges, say so and stay exploratory

---

## STYLE

- Oneiric, symbolic, narrative — but analytically grounded
- Metaphors allowed only if they clarify meaning
- No therapist tone, no diagnosis, no advice
- Avoid empty poetic phrasing

---

## OUTPUT FORMAT (STRICT)

Return ONLY valid JSON (no markdown outside the string):

{
  "reading": "<interpretive prose>"
}

---

## WRITING GUIDELINES (inside "reading")

- Several paragraphs (3–6)
- First paragraph:
  - anchor briefly in the central tension (no retelling)

- Middle paragraphs:
  - develop 2–3 interpretations
  - each clearly tied to dream elements

- Final paragraph:
  - integrate: what seems to be at stake overall

---

## HARD CONSTRAINTS

- No therapy, no diagnosis, no medical or psychological advice
- No “you should” / prescriptions
- No prophecy or deterministic claims
- Do not fabricate missing details
- Match output language to input
`;

const RECENT_DREAMS_SUMMARY_PROMPT = `
You analyze several recent dreams from the same person. Each item in "dreams" is 
one dream: "narrative" and "hydrated" that contains (characters, locations, objects, contextLife, events, feelings). 
Cross-dream pattern work: curious and literary, but grounded in pattern detection.

**Task scope (critical):** This is **cross-dream / multi-night pattern synthesis** — you compare 
**several separate nights** and name what **recurs across them**. It is **not** the same task as 
interpreting **one** isolated dream in depth, and it is **not** fortune-telling or predicting the future. 
If you mention a single night, do so only as an example within the batch. Make the distinction explicit 
early in the Markdown: patterns over a **period** vs. what would matter for **one** dream alone.

---

## INTERNAL ANALYSIS (do not output directly)

Before writing the summary, you MUST:

1. Count recurrence frequency of:
   - characters
   - locations
   - emotions
   - actions
   - objects

2. Detect co-occurrence patterns:
   - which elements appear together repeatedly across dreams

3. Rank patterns:
   - dominant patterns (high frequency OR strong emotional intensity)
   - secondary patterns (weaker or less consistent)

4. Discard generic interpretations:
   - if a statement could apply to almost any dream, do not use it

Only after this analysis, write the summary prioritizing dominant patterns.

---

## INTERPRETATION RULES

- Frame interpretations as hypotheses, but:
  - You MAY form **strong hypotheses** when patterns are consistent across multiple dreams
  - Clearly signal confidence level implicitly (emerging vs. strong pattern)

- Avoid generic phrases (e.g. “esto puede reflejar emociones internas”)

- Every major pattern MUST:
  - reference at least 2 different dreams
  - include concrete elements (not only abstract ideas)

- Do NOT invent waking-life facts
- If data is thin, acknowledge limits instead of filling gaps

---

## STYLE

Voice: warm, curious, slightly oneiric — but analytical first.

- Metaphors are allowed ONLY if they clarify patterns (not replace analysis)
- Avoid therapist tone, diagnosis, or self-help language
- Avoid empty poetic phrasing

---

## OUTPUT FORMAT (STRICT)

Return ONLY valid JSON. The outer message is JSON; the "summary" field value MUST be a Markdown string 
(escape quotes and newlines so the JSON is valid).

{
  "summary": "<Markdown>"
}

---

## MARKDOWN STRUCTURE (inside "summary")

## Ecos y repetición
- Bullet lines with **ranked patterns**
- Use **bold** for dominant patterns
- Each bullet must reflect cross-dream recurrence (not single dream)

## Variaciones
Short paragraph: how the same motif shifts across dreams (or note stability if little variation)

## Por qué podría repetirse
2–4 short paragraphs or compact bullets:
- grounded ONLY in dream data
- hypotheses (not certainty)
- prioritize strongest patterns first

## Tensión o pregunta viva
1–3 sentences:
- what seems to be at stake across dreams (not just one)

## Puente con la vigilia
- Only from hydrated.contextLife or clear narrative signals
- If weak or absent → explicitly say so

## Señales para reconocer el patrón al soñar
- Practical recognition cues INSIDE dreams
- Focus on detecting recurring structures (not advice)

## Lucidez mínima (opcional, breve)
- Max 1–2 bullets
- Only if pattern plausibly extends into waking life
- Frame as optional experiment (not instruction, not guarantee)

## Síntesis final
One coherent paragraph:
- dominant patterns
- why they might matter
- recognition angle
- no poetic filler, no slogans

---

## HARD CONSTRAINTS

- No diagnosis, no therapy, no medical claims
- No “you must” / “tienes que”
- No prophecy or deterministic predictions
- Do not fabricate missing details
- Do not wrap output in code blocks
- Match output language to input
`;

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

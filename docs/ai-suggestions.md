# Sugerencias de entidades con IA (`POST /ai/suggest-entities`)

Este endpoint, a partir de texto libre del sueño, **sugiere** posibles personajes, lugares y objetos oníricos. **No guarda nada**; el cliente revisa y luego persistirá según el modelo de dominio que definan (aún no expuesto en esta capa mínima de API).

---

## Requisitos en el servidor

El backend está pensado para **[DeepSeek](https://api-docs.deepseek.com/)** (API compatible con OpenAI: `POST /v1/chat/completions`).

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `AI_API_KEY` | Sí, para usar el endpoint | Clave de la API de DeepSeek. Si falta, el servidor responde **503**. |
| `OPENAI_API_KEY` | No | Alias opcional: si no definís `AI_API_KEY`, se usa este nombre (útil si ya tenías scripts con el nombre antiguo). |
| `AI_MODEL` | No | Modelo de chat (por defecto `deepseek-chat`; otro ejemplo oficial: `deepseek-reasoner`). |
| `AI_BASE_URL` | No | URL base (por defecto `https://api.deepseek.com/v1`). Para otro proveedor compatible, cambiá base y modelo (ej. OpenAI: `https://api.openai.com/v1` y `gpt-4o-mini`). |

Copiá los valores en `.env` (partiendo de `.env.example`).

---

## Petición

**`POST /ai/suggest-entities`**

Cuerpo JSON:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `text` | string | Sí | Narrativa del sueño. Longitud máxima **16000** caracteres. |
| `locale` | string | No | Pista BCP 47 (p. ej. `es`, `en`) para que las descripciones sigan el idioma del relato. |

**Ejemplo (curl):**

```bash
curl -s -X POST "http://localhost:3000/ai/suggest-entities" \
  -H "Content-Type: application/json" \
  -d '{"text":"Soñé que caminaba por un bosque con mi hermana y encontramos una llave roja.","locale":"es"}'
```

---

## Respuesta (éxito)

JSON con tres listas (pueden estar vacías):

```json
{
  "characters": [
    {
      "name": "hermana",
      "description": "…",
      "isKnown": true,
      "archetype": "PERSONA",
      "quote": "con mi hermana"
    }
  ],
  "locations": [
    {
      "name": "bosque",
      "description": "…",
      "isFamiliar": false,
      "setting": "NATURE",
      "quote": "por un bosque"
    }
  ],
  "objects": [
    {
      "name": "llave roja",
      "description": "…",
      "quote": "una llave roja"
    }
  ]
}
```

### Significado de campos (alineado al dominio de la API)

No incluye **eventos de vida**: esos se gestionan aparte (`/life-events` y `relatedLifeEventIds` en la sesión; ver esquema `LifeEvent` en `src/schemas/life-event.schema.ts`).

- **`characters`**
  - `archetype`: uno de `SHADOW`, `ANIMA_ANIMUS`, `WISE_FIGURE`, `PERSONA`, `UNKNOWN` (mismo criterio que `Archetype` en `character.ts`).
  - `isKnown`: si la figura se reconoce como alguien de la vida despierta.
  - `quote`: fragmento opcional del texto de entrada para resaltar en la UI.
- **`locations`**
  - `setting`: `URBAN`, `NATURE`, `INDOOR`, `ABSTRACT` (como `LocationSetting` en `location.ts`).
  - `isFamiliar`: si el lugar se siente “conocido” frente a totalmente onírico.
- **`objects`**: objetos materiales o simbólicos (`DreamObject` en `dream-object.ts`).

Valores desconocidos o mal formados del modelo se **normalizan** en servidor (p. ej. arquetipo inválido → `UNKNOWN`).

---

## Cómo encajarlo en el flujo de la app

1. El cliente envía la narrativa en `POST /ai/suggest-entities` (`text`).
2. Muestra sugerencias; el usuario acepta, corrige o ignora.
3. La persistencia (sesiones, entidades enlazadas, etc.) será responsabilidad del modelo de datos que se implemente después; este endpoint solo devuelve JSON sugerido.

El prompt del servidor pide **no** hacer interpretación terapéutica; solo etiquetado de entidades.

---

## Errores habituales

| Código | Situación |
|--------|-----------|
| **400** | Cuerpo inválido (validación: `text` vacío, demasiado largo, campos no permitidos). |
| **503** | `AI_API_KEY` / `OPENAI_API_KEY` no configuradas. |
| **502** | Fallo del proveedor de IA (red, clave, cuota, respuesta no JSON). |

---

## Privacidad y coste

- El texto del sueño se envía al **proveedor** configurado (por defecto **DeepSeek**, `api.deepseek.com`). Evaluá políticas de privacidad y región antes de producción.
- Cada llamada consume tokens; conviene límites en el cliente y textos razonables (el servidor limita `text` a 16k caracteres).

---

## Elementos: sugerencias + catálogo (`POST /dream-sessions/:id/ai/suggest-elements`)

Para el paso **Elementos**, el servidor lee **`rawNarrative`** de la sesión (no hace falta reenviar el texto), llama al modelo con un prompt ampliado (personajes, lugares, objetos, **eventos oníricos**; **sin** sentimientos ni **contexto vital** — ese catálogo solo se rellena a mano) y **empareja** cada nombre/título con Mongo (misma cadena, comparación case-insensitive con anclas).

**No persiste** nada ni modifica `analysis.entities` ya guardados: solo devuelve JSON para que el cliente lo use como staging hasta que el usuario pulse **Guardar**.

### Petición

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `locale` | string | No | Igual que en `/ai/suggest-entities` (pista de idioma para el modelo). |

**Ejemplo:**

```bash
curl -s -X POST "http://localhost:3000/dream-sessions/<SESSION_ID>/ai/suggest-elements" \
  -H "Content-Type: application/json" \
  -d '{"locale":"es"}'
```

### Respuesta (`schemaVersion`: 1)

Cuatro listas (`characters`, `locations`, `objects`, `events`); cada ítem tiene:

- **`fromAi`**: payload sugerido por el modelo (incluye `confidence` 0–1 cuando el modelo lo informa).
- **`match`**: si existe fila en catálogo, `{ "catalogId", "canonicalLabel" }`; si no, `null`.
  - Eventos oníricos (`dream_events`) se buscan **solo** para el `dreamSessionId` de esa sesión (`label` igual, case-insensitive).
  - Personajes, lugares y objetos son catálogos globales (`name`).
- **`emphasizeNew`**: `true` cuando **no** hay `match`, el modelo informó `confidence` ≥ **0.85** y el cliente puede resaltar la fila como “nueva con alta confianza”.

### Errores

| Código | Situación |
|--------|-----------|
| **400** | La sesión no tiene `rawNarrative` no vacío. |
| **404** | `id` de sesión inválido o inexistente. |
| **503** / **502** | Igual que `/ai/suggest-entities` (IA no configurada o fallo del proveedor). |

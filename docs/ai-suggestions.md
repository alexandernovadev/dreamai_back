# IA (DeepSeek / OpenAI-compatible)

Las sugerencias se invocan **por sesión de sueño** (`dream-sessions`), no con texto suelto. El servidor usa la narrativa guardada (`rawNarrative`) y, en Reflexión, opcionalmente `userThought`.

---

## Requisitos en el servidor

El backend está pensado para **[DeepSeek](https://api-docs.deepseek.com/)** (API compatible con OpenAI: `POST /v1/chat/completions`).

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `AI_API_KEY` | Sí, para usar la IA | Clave de la API de DeepSeek. Si falta, el servidor responde **503**. |
| `OPENAI_API_KEY` | No | Alias opcional: si no definís `AI_API_KEY`, se usa este nombre. |
| `AI_MODEL` | No | Modelo de chat (por defecto `deepseek-chat`). |
| `AI_BASE_URL` | No | URL base (por defecto `https://api.deepseek.com/v1`). |

Copiá los valores en `.env` (partiendo de `.env.example`).

---

## Elementos: `POST /dream-sessions/:id/ai/suggest-elements`

Para el paso **Elementos**, el servidor lee **`rawNarrative`** de la sesión, llama al modelo (personajes, lugares, objetos, **eventos oníricos**; **sin** sentimientos ni contexto vital) y **empareja** cada nombre con Mongo.

**No persiste** nada ni modifica `analysis.entities` ya guardados.

### Petición

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `locale` | string | No | Pista de idioma para el modelo (p. ej. `es`). |

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
| **503** | `AI_API_KEY` / `OPENAI_API_KEY` no configuradas. |
| **502** | Fallo del proveedor de IA (red, clave, cuota, respuesta no JSON). |

---

## Reflexión: `POST /dream-sessions/:id/ai/suggest-thought`

Lectura onírica avanzada: el servidor **no** envía el documento `session` a la IA. Arma un JSON con `narrative`, campos opcionales (`userThought`, `dreamKind`, `perspectives`, `lucidityLevel`) y **`hydrated`** como listas ordenadas **sin ids** (nombres, títulos, etiquetas, sentimientos; `contextLife` con título/descripción de vigilia). Exige **`rawNarrative`** no vacío en la sesión. **No persiste**; el cliente puede guardar el texto en `aiSummarize` con `PATCH /dream-sessions/:id`.

### Petición

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `locale` | string | No | Pista de idioma (p. ej. `es`). |

### Respuesta (`schemaVersion`: 1)

| Campo | Descripción |
|-------|-------------|
| `suggestion` | Prosa de lectura interpretativa (no terapia ni diagnóstico). |

Errores: mismos códigos que en Elementos (400 si falta narrativa, 404, 503, 502).

---

## Privacidad y coste

- El texto se envía al **proveedor** configurado (por defecto **DeepSeek**). Evaluá políticas de privacidad y región antes de producción.
- Cada llamada consume tokens; conviene límites en el cliente.

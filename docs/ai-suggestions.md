# Sugerencias de entidades con IA (`POST /ai/suggest-entities`)

Este endpoint ayuda en el **refinamiento** del sueño: a partir de texto libre (por ejemplo `rawNarrative` o el `rawText` de un segmento), un modelo de lenguaje **sugiere** posibles personajes, lugares y objetos oníricos. **No guarda nada en base de datos**; el cliente debe revisar, editar y luego persistir con las rutas habituales (`/dream-sessions`, catálogo, etc.).

---

## Requisitos en el servidor

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `OPENAI_API_KEY` | Sí, para usar el endpoint | Clave de la API de OpenAI (o compatible). Si falta, el servidor responde **503**. |
| `AI_MODEL` | No | Modelo de chat (por defecto `gpt-4o-mini`). |
| `AI_BASE_URL` | No | URL base del proveedor (por defecto `https://api.openai.com/v1`). Útil para proxies compatibles con OpenAI. |

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

### Significado de campos (alineado a `docs/types/`)

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

1. Usuario escribe el sueño en **Draft** (`rawNarrative` o segmentos con `rawText`).
2. Al pasar a **Refining**, el cliente puede llamar a `POST /ai/suggest-entities` con ese texto.
3. Mostrar sugerencias; el usuario acepta, corrige o ignora.
4. Para persistir, generá ids locales (`crypto.randomUUID()` o el esquema que use el cliente) y construí `DreamSegment.analysis.entities` según `docs/types/dream.ts`.
5. Si un personaje coincide con el **catálogo**, enlazá `catalogCharacterId` (y análogo para lugares/objetos) antes de `PATCH /dream-sessions/:id`.

El prompt del servidor pide **no** hacer interpretación terapéutica; solo etiquetado de entidades.

---

## Errores habituales

| Código | Situación |
|--------|-----------|
| **400** | Cuerpo inválido (validación: `text` vacío, demasiado largo, campos no permitidos). |
| **503** | `OPENAI_API_KEY` no configurada. |
| **502** | Fallo del proveedor de IA (red, clave, cuota, respuesta no JSON). |

---

## Privacidad y coste

- El texto del sueño se envía al **proveedor** configurado (`AI_BASE_URL`). Evaluá políticas de privacidad y región antes de producción.
- Cada llamada consume tokens; conviene límites en el cliente y textos razonables (el servidor limita `text` a 16k caracteres).

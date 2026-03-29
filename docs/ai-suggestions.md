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

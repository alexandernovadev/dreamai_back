# Documentación Dreamia (backend)

Contrato de dominio y guías de uso para clientes (móvil, web) y para quien despliegue la API.

| Documento | Contenido |
|-----------|-----------|
| [GUIA-DREAMIA-BACK.md](GUIA-DREAMIA-BACK.md) | Rutas HTTP, variables de entorno, reglas de validación, orden de uso. |
| [dream-workflow-sequence.md](dream-workflow-sequence.md) | Estados de sesión (`Draft` → … → `ReflectionsDone`) y diagrama. |
| [ai-suggestions.md](ai-suggestions.md) | `POST /ai/suggest-entities` (DeepSeek por defecto). |
| **types/** | Tipos TypeScript compartidos (ver abajo). |

En el código del servidor, los mismos conceptos se persisten con **Mongoose** en `src/schemas/` (colecciones `catalog_characters`, `dream_sessions`, etc.).

## `docs/types/` (contrato)

| Archivo | Qué modela |
|---------|------------|
| `dream.ts` | `DreamSession`, segmentos, estados, `DreamKind`. |
| `character.ts`, `location.ts`, `dream-object.ts`, `feeling.ts` | Entidades dentro de `dreams[].analysis.entities`. |
| `life-event.ts` | **Evento de vida** (`/life-events`). Las sesiones solo guardan **ids** en `relatedLifeEventIds`; hay que resolver título/fecha vía API. |

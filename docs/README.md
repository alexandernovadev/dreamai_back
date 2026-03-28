# Documentación Dreamia (backend)

Guías de uso para clientes (móvil, web) y para quien despliegue la API.

| Documento | Contenido |
|-----------|-----------|
| [GUIA-DREAMIA-BACK.md](GUIA-DREAMIA-BACK.md) | Rutas HTTP, variables de entorno, reglas de validación, orden de uso. |
| [dream-workflow-sequence.md](dream-workflow-sequence.md) | Estados de sesión (`Draft` → … → `ReflectionsDone`) y diagrama. |
| [ai-suggestions.md](ai-suggestions.md) | `POST /ai/suggest-entities` (DeepSeek por defecto). |

## Contrato de datos en el servidor

Los modelos y enums que usa la API están en el código:

| Ubicación | Contenido |
|-----------|-----------|
| `src/schemas/` | Esquemas Mongoose (colecciones: sueños, catálogo, eventos de vida). |
| `src/domain/enums.ts` | `DreamKind`, `DreamSessionStatus`, `Archetype`, `LocationSetting`. |

Los clientes pueden replicar tipos a partir de las respuestas JSON de la API o copiar/adaptar interfaces desde esos archivos si comparten TypeScript.

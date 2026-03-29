# Guía del backend Dreamia (capa mínima)

## Variables de entorno

| Variable | Propósito |
|----------|-----------|
| `PORT` | Puerto (opcional; por defecto 3000). |
| `CORS_ORIGINS` | Orígenes permitidos, separados por comas. Por defecto localhost 8081, 3000, 8080. |
| `CORS_CREDENTIALS` | `true` si usás cookies/credenciales cross-origin. |
| `APP_ENV` | Opcional; metadatos en `GET /`. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Obligatorias para `POST /cloudinary/upload`. |
| `CLOUDINARY_ROOT_PREFIX` | Opcional; prefijo de carpetas (default `dreamia`). |
| `AI_API_KEY` / `OPENAI_API_KEY` | Para `POST /ai/suggest-entities`. |
| `AI_MODEL`, `AI_BASE_URL` | Opcionales; ver [ai-suggestions.md](ai-suggestions.md). |

Copiá `.env.example` a `.env` en la raíz del repo.

## Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Metadatos de la app. |
| GET | `/health` | Salud del proceso. |
| POST | `/ai/suggest-entities` | Sugerencias de entidades desde texto. |
| POST | `/cloudinary/upload` | Subida de imagen (`multipart` campo `file`). Query `context` opcional. |

Detalle del flujo de IA: **[ai-suggestions.md](ai-suggestions.md)**.

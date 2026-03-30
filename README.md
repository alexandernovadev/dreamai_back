# Dreamia — backend

API en [NestJS](https://nestjs.com/). Expone **metadatos**, **salud**, **dominio de sueños** (sesiones, catálogos), **IA por sesión** y **subida de imágenes a Cloudinary**.

## Endpoints (resumen)

- **`GET /`** — `version`, `date` (build), `environment`
- **`GET /health`** — `{ "status": "ok" }`
- **`/dream-sessions`** — CRUD de sesiones; **IA**: `POST .../ai/suggest-elements`, `POST .../ai/suggest-thought` (requiere `AI_API_KEY`; ver [docs/ai-suggestions.md](docs/ai-suggestions.md))
- **`POST /cloudinary/upload`** — multipart `file`; query `context`: `dreams` | `characters` | `locations` | `objects`

Variables: copiar `.env.example` a `.env`. Guía breve: [docs/GUIA-DREAMIA-BACK.md](docs/GUIA-DREAMIA-BACK.md).

## Requisitos

- Node.js **20+**
- Yarn

## Instalación

```bash
yarn install
yarn build
yarn start:dev
```

## Docker

Ver `Dockerfile` (no requiere MongoDB en runtime para esta capa mínima).

# Dreamia — backend

API en [NestJS](https://nestjs.com/). En esta versión el repo expone **metadatos**, **salud**, **sugerencias de entidades con IA** y **subida de imágenes a Cloudinary**. El dominio de sueños / persistencia se reintroducirá según el nuevo modelo.

## Endpoints

- **`GET /`** — `version`, `date` (build), `environment`
- **`GET /health`** — `{ "status": "ok" }`
- **`POST /ai/suggest-entities`** — sugerencias desde texto (requiere `AI_API_KEY` en servidor; ver [docs/ai-suggestions.md](docs/ai-suggestions.md))
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

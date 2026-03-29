# Dreamia — backend

Backend en [NestJS](https://nestjs.com/) para **Dreamia**: una app pensada para **registrar y explorar tus sueños** con el tiempo — no solo como diario, sino como material para **entender el mundo onírico** (patrones, figuras recurrentes, tono emocional) y reflexionar sobre **cómo se relaciona lo que soñamos con cómo entendemos el mundo**, incluida una dimensión **metafísica** o de sentido: qué vuelve, qué pregunta deja, qué imagen resiste.

Este repositorio es la **API y la lógica de servidor**; el cliente (móvil o web) vive aparte.

## Dominio y documentación

El modelo de producto vive en `docs/`:

- **[Guía del backend (uso, rutas, entorno, sin código)](docs/GUIA-DREAMIA-BACK.md)** — qué hay y cómo usarlo.
- **[Sugerencias de entidades con IA](docs/ai-suggestions.md)** — `POST /ai/suggest-entities`, variables de entorno y flujo con el refinamiento.
- **[Flujo de una sesión de sueño](docs/dream-workflow-sequence.md)** — estados (`Draft` → `Refining` → `Structured` → `ReflectionsDone`) y catálogo de personajes.
- **Documentación** en `docs/` — guía HTTP y flujos; el modelo persistido está en **`src/schemas/`** y enums en **`src/domain/enums.ts`**. Índice: [docs/README.md](docs/README.md).

Sirven como contrato compartido con el front y como referencia al implementar endpoints y persistencia.

## API (MVP)

- **`GET /`** — saludo comprobación.
- **`GET /health`** — salud para balanceadores y contenedores (`{ "status": "ok" }`).
- **`POST /ai/suggest-entities`** — sugerencias de personajes, lugares y objetos a partir de texto libre (opcional; por defecto **DeepSeek**; requiere `AI_API_KEY`; ver [docs/ai-suggestions.md](docs/ai-suggestions.md)).
- **`/dream-sessions`** — CRUD de sesiones; `GET` admite query `catalogCharacterId`, `catalogLocationId`, `catalogObjectId`, `lifeEventId` (AND de filtros).
- **`/catalog/characters`**, **`/catalog/locations`**, **`/catalog/objects`** — CRUD de entradas de catálogo (Mongo `ObjectId` como `id`).
- **`GET /catalog/.../:id/dream-sessions`** — sueños vinculados a esa entrada de catálogo.
- **`/life-events`** — CRUD de eventos de vida (`title`, `note`, `occurredAt`); **`GET /life-events/:id/dream-sessions`** — sueños que referencian ese id en `relatedLifeEventIds`.

En los segmentos (`dreams` JSON), las apariciones enlazan con `catalogCharacterId`, `catalogLocationId`, `catalogObjectId`; al guardar la sesión se rellenan los arrays `catalog*Ids` en el documento para búsquedas rápidas. A nivel de sesión, `relatedLifeEventIds` apunta por id a **`/life-events`** (sin objeto embebido; resolvelos en el cliente o con la API).

### Reglas alineadas a `docs/` (validación en servidor)

- **DRAFT / REFINING**: `dreamKind` debe ser **`UNKNOWN`**; el análisis por segmento puede ir incompleto.
- **STRUCTURED / REFLECTIONS_DONE**: `dreamKind` distinto de **`UNKNOWN`**; al menos un segmento; cada segmento con **`analysis`** completo (perspectiva, entidades, **`lucidityLevel` 0–5**) según validación en `src/dream-sessions/dream-session-validation.service.ts`.
- **REFLECTIONS_DONE**: **`userThought`** obligatorio (no vacío).
- **`relatedLifeEventIds`**: cada id debe existir en **`/life-events`**.
- Referencias **`catalogCharacterId` / `catalogLocationId` / `catalogObjectId`** en `dreams` deben existir en el catálogo correspondiente.

## Requisitos

- Node.js **20 o superior** (LTS recomendado). La **imagen Docker** usa **`node:20-alpine`** (`Dockerfile`).
- [Yarn](https://yarnpkg.com/) (el lockfile del repo es Yarn).

## Instalación

```bash
yarn install
```

Copia `.env.example` a `.env` y ajusta `DATABASE_URL` (MongoDB; ver guía). Para sugerencias de IA, añade `AI_API_KEY` de DeepSeek (ver [docs/ai-suggestions.md](docs/ai-suggestions.md)). Mongo local:

```bash
docker compose up -d
```

## Scripts

| Comando | Uso |
|--------|-----|
| `yarn start` | Arranque en modo desarrollo |
| `yarn start:dev` | Desarrollo con recarga al guardar |
| `yarn start:debug` | Igual, con inspector para depuración |
| `yarn build` | Compilación (`nest build`) |
| `yarn start:prod` | Ejecuta `node dist/main` (tras `build`) |
| `yarn lint` | ESLint sobre `src`, `apps`, `libs` |

Persistencia: **Mongoose** (`mongoose`, `@nestjs/mongoose`); esquemas en `src/schemas/`.

## Imagen Docker (producción)

En la raíz del repo hay un **`Dockerfile`** multi-stage basado en **`node:20-alpine`** (builder y runtime). Ejemplo:

```bash
docker build -t dreamia-back .
docker run --rm -p 3000:3000 -e DATABASE_URL="mongodb://host.docker.internal:27017/dreamia" dreamia-back
```

Definí **`DATABASE_URL`** (y el resto de variables de [docs/GUIA-DREAMIA-BACK.md](docs/GUIA-DREAMIA-BACK.md)) en el entorno del contenedor o en un secret. El healthcheck usa **`GET /health`** y el puerto de **`PORT`** (por defecto 3000).

## Licencia

[MIT](LICENSE) — Copyright (c) novalabs.

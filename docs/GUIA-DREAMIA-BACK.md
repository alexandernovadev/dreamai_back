# Guía del backend Dreamia

Documento orientado a **qué existe**, **cómo encaja** y **cómo usarlo** (HTTP, variables de entorno, reglas de negocio). El contrato de datos vive en el código (`src/schemas/`, `src/domain/enums.ts`).

---

## 1. Rol de este servicio

Es la **API HTTP** de Dreamia: guardar y consultar **sesiones de sueño**, **catálogo** (personajes, lugares, objetos recurrentes) y **eventos de vida** enlazados a sesiones.

- **Autenticación:** no hay usuarios ni tokens en esta versión; cualquier cliente que alcance la URL puede usar la API (adecuado solo para desarrollo o redes cerradas).
- **Base de datos:** MongoDB, accedida con **Mongoose** (esquemas en `src/schemas/`).
- **Puerto por defecto:** el que definas en la variable de entorno del proceso (típicamente 3000).

---

## 2. Variables de entorno

| Variable | Propósito |
|----------|-----------|
| `DATABASE_URL` | URI de MongoDB (el nombre de base suele ir en el path, p. ej. `.../dreamia`). |
| `MONGODB_DATABASE` | Opcional: nombre de base si la URI no lo lleva en el path. |
| `PORT` | Puerto donde escucha la app (opcional). |
| `AI_API_KEY` | Clave de **DeepSeek** para `POST /ai/suggest-entities` (opcional; sin clave ese endpoint responde 503). También se acepta `OPENAI_API_KEY` como alias. |
| `AI_MODEL` | Modelo de chat (opcional; por defecto `deepseek-chat`). |
| `AI_BASE_URL` | URL base compatible con OpenAI (opcional; por defecto `https://api.deepseek.com/v1`). |

Copia `.env.example` a **`.env` en la raíz del repo** (junto a `package.json`); `@nestjs/config` lo carga al arrancar. Detalle de uso del endpoint de IA: **[Sugerencias de entidades con IA](ai-suggestions.md)**.

---

## 3. Arranque y base de datos

1. Instalar dependencias del proyecto (según el gestor que uses en el repo).
2. Tener MongoDB accesible (local con Docker Compose o instancia remota). El `docker-compose.yml` del repo levanta un `mongod` estándar (no hace falta replica set para este API).
3. Configurar `DATABASE_URL` en `.env` (ver `.env.example`). Mongoose crea las colecciones al escribir la primera vez.
4. Arrancar el servidor en modo desarrollo o producción según los scripts del `package.json`.

---

## 4. Visión del dominio (alineada a `docs/`)

- Una **sesión de sueño** tiene estado (`Draft` → `Refining` → `Structured` → `ReflectionsDone`), tipo de noche (`dreamKind`), texto libre opcional, reflexión opcional salvo en el último estado, vínculos a eventos de vida, y un array **JSON** de **segmentos** (`dreams`).
- Cada segmento puede llevar **análisis** (perspectiva, entidades, lucidez). En borrador y refinamiento el análisis puede ir incompleto; en estados “cerrados” el servidor exige forma completa según las reglas descritas más abajo.
- **Catálogo:** entradas persistentes de personajes, lugares y objetos. Dentro del JSON de segmentos se enlazan con identificadores de catálogo; el backend mantiene listas de ids en la sesión para filtrar rápido.
- **Eventos de vida:** entidad propia en `/life-events` (esquema `LifeEvent` en `src/schemas/life-event.schema.ts`). En la sesión solo se guardan **referencias por id** en `relatedLifeEventIds`: no se incrusta el título ni la fecha del evento en el documento del sueño; el cliente debe **resolver** cada id con `GET /life-events` o el detalle si hace falta mostrar datos en pantalla.

El flujo narrativo detallado está en `dream-workflow-sequence.md`; enums y modelos persistidos están en `src/domain/enums.ts` y `src/schemas/`.

---

## 5. Reglas que aplica el servidor al guardar sesiones

- **Draft y Refining:** la clasificación global de la noche debe ser **desconocida** (`Unknown`); el análisis por segmento puede estar incompleto.
- **Structured y ReflectionsDone:** la clasificación global ya no puede ser “desconocida”; debe haber al menos un segmento y cada segmento debe llevar **análisis completo** (perspectiva, entidades con listas, **lucidez**), con enums y campos coherentes con la validación del servidor (`dream-session-validation.service.ts`). En `analysis`, **`lucidityLevel`** es un entero **0–5** (0 = sin lucidez; 1–5 = grado de lucidez). El campo booleano `isLucid` ya no se usa en validación.
- **ReflectionsDone:** la reflexión del usuario es obligatoria y no puede ser solo espacios.
- **Referencias:** todo id en `relatedLifeEventIds` debe existir como evento de vida; todo `catalogCharacterId`, `catalogLocationId` y `catalogObjectId` usado dentro de `dreams` debe existir en el catálogo correspondiente.

Las actualizaciones parciales (`PATCH`) se validan contra el **estado resultante** (lo enviado más lo ya guardado).

---

## 6. Catálogo de rutas HTTP

Rutas relativas a la raíz del servicio (sin incluir dominio ni puerto).

### Raíz

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| GET | `/` | Comprobación viva; respuesta de texto fija. |
| GET | `/health` | Estado del proceso (`{ "status": "ok" }`); usado por Docker/Kubernetes. |

### IA (sugerencias, sin persistir)

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| POST | `/ai/suggest-entities` | A partir de texto libre del sueño, sugiere personajes, lugares y objetos (requiere `AI_API_KEY` o `OPENAI_API_KEY`; por defecto DeepSeek). |

Ver cuerpo de petición, respuesta y flujo recomendado en **[ai-suggestions.md](ai-suggestions.md)**.

### Sesiones de sueño

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| POST | `/dream-sessions` | Crear sesión (cuerpo con timestamp, estado, tipo de sueño, segmentos JSON, etc.). |
| GET | `/dream-sessions` | Listar sesiones; admite filtros en query (ver tabla siguiente). |
| GET | `/dream-sessions/{id}` | Obtener una sesión por identificador Mongo. |
| PATCH | `/dream-sessions/{id}` | Actualizar campos parciales. |
| DELETE | `/dream-sessions/{id}` | Eliminar la sesión. |

**Query en listado (`GET /dream-sessions`):** puedes combinar varios filtros; todos se aplican a la vez (intersección).

| Parámetro de query | Efecto |
|--------------------|--------|
| `catalogCharacterId` | Sesiones que referencian ese personaje de catálogo en los ids denormalizados. |
| `catalogLocationId` | Igual para lugares. |
| `catalogObjectId` | Igual para objetos. |
| `lifeEventId` | Sesiones que incluyen ese id en `relatedLifeEventIds`. |

### Catálogo — personajes

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| POST | `/catalog/characters` | Crear entrada de personaje. |
| GET | `/catalog/characters` | Listar (orden alfabético por nombre). |
| GET | `/catalog/characters/{id}` | Detalle. |
| PATCH | `/catalog/characters/{id}` | Actualizar. |
| DELETE | `/catalog/characters/{id}` | Borrar. |
| GET | `/catalog/characters/{id}/dream-sessions` | Sueños en los que aparece ese personaje (vía ids denormalizados). |

### Catálogo — lugares

Misma forma que personajes, con prefijo `/catalog/locations` y la subruta `.../{id}/dream-sessions` análoga.

### Catálogo — objetos oníricos

Misma forma con prefijo `/catalog/objects` y la subruta `.../{id}/dream-sessions` análoga.

### Eventos de vida

| Método | Ruta | Descripción breve |
|--------|------|-------------------|
| POST | `/life-events` | Crear evento (título, nota opcional, fecha opcional). |
| GET | `/life-events` | Listar. |
| GET | `/life-events/{id}` | Detalle. |
| PATCH | `/life-events/{id}` | Actualizar. |
| DELETE | `/life-events/{id}` | Borrar. |
| GET | `/life-events/{id}/dream-sessions` | Sueños que referencian ese evento en `relatedLifeEventIds`. |

---

## 7. Cuerpos y validación HTTP genérica

- Las entradas JSON se validan con reglas declarativas (campos obligatorios, tipos, enums donde aplique).
- Los errores de validación suelen devolver código 400; las reglas de negocio de sesión que no pasan (estado vs tipo de sueño, catálogo inexistente, etc.) suelen devolver 422; recurso no encontrado, 404.

---

## 8. Orden recomendado de uso en el cliente

1. Crear entradas de **catálogo** y **eventos de vida** que vayas a referenciar.
2. Crear o ir actualizando **sesiones de sueño** pasando de borrador a refinamiento y luego a estructurado cuando el contenido esté listo.
3. En **refinamiento**, opcionalmente llamar a **`POST /ai/suggest-entities`** con el texto del sueño para obtener sugerencias de entidades; el usuario las revisa y luego persistís con `PATCH` / catálogo como siempre.
4. Usar los listados filtrados y las rutas `.../{id}/dream-sessions` para montar **enlaces** en un dashboard (de un ítem a las noches donde aparece).

---

## 9. Documentos relacionados en el repo

| Ubicación | Contenido |
|-----------|-----------|
| `docs/README.md` | Índice de esta carpeta. |
| `src/schemas/`, `src/domain/enums.ts` | Esquemas Mongoose y enums (contrato de persistencia en el servidor). |
| `docs/dream-workflow-sequence.md` | Flujo por estados y diagrama de secuencia. |
| `docs/ai-suggestions.md` | Endpoint `POST /ai/suggest-entities`, variables de entorno y ejemplo de uso. |
| `README.md` (raíz) | Resumen del proyecto, scripts y enlace a licencia. |
| `src/schemas/` | Esquemas Mongoose (colecciones y campos persistidos). |

---

## 10. Limitaciones conscientes

- Sin autenticación ni multi-tenant.
- Sin tests automatizados en el flujo actual del repo.
- Las sugerencias de IA dependen de un **proveedor externo** (por defecto **DeepSeek**) y de `AI_API_KEY` (o `OPENAI_API_KEY`); el texto del sueño sale del servidor hacia ese proveedor.

Si ampliáis producto (usuarios, cuotas, colas, etc.), esta guía habrá de actualizarse en las mismas secciones.

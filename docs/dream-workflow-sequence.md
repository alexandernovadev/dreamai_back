# Flujo de una sesión de sueño (diagrama de secuencia)

Describe cómo interactúan el usuario, la app y el catálogo de personajes a lo largo de `DreamSessionStatus`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant App as App (DreamSession)
    participant Cat as Catálogo / DB

    Note over U,Cat: Paso 1 — Captura (Draft)
    U->>App: Escribe narrativa (rawNarrative y/o segmentos con rawText)
    App->>App: status = Draft
    U->>App: Guarda borrador

    Note over U,Cat: Paso 2 — Refinamiento (Refining)
    U->>App: Pasa a refinamiento / segmenta / añade feelings
    App->>App: status = Refining
    U->>App: Acepta, corrige o crea todo manualmente
    opt Personaje ya visto antes
        U->>Cat: Busca o crea personaje recurrente
        Cat-->>App: catalogCharacterId
        App->>App: Enlaza aparición en Character
    end
    U->>App: Completa analysis por segmento (perspectiva, personajes, lugares, objetos, lucidez)

    Note over U,Cat: Paso 3 — Cierre estructural (Structured)
    U->>App: Confirma que el modelo onírico está listo
    App->>App: status = Structured
    App->>App: dreamKind, eventos opc. (relatedLifeEventIds)

    Note over U,Cat: Paso 4 — Pensamiento (ReflectionsDone)
    opt Reflexión explícita
        U->>App: Escribe userThought
        App->>App: status = ReflectionsDone
    end
```

## Estados y datos (referencia rápida)

| Estado en el diagrama | `DreamSessionStatus` | Idea |
|----------------------|----------------------|------|
| Captura | `Draft` | Texto; `analysis` puede faltar. |
| Refinamiento | `Refining` | Extracción manual; `analysis` se va llenando. |
| Cierre estructural | `Structured` | Entidades coherentes; listo para patrones / historial. |
| Pensamiento | `ReflectionsDone` | `userThought` registrado (paso opcional según producto). |

En GitHub, GitLab o editores con preview Mermaid el diagrama se renderiza solo. Si un paso es opcional en tu producto (por ejemplo saltar reflexión), el usuario puede quedarse en `Structured` sin pasar a `ReflectionsDone`.

## Eventos de vida (`relatedLifeEventIds`)

Opcional en cualquier estado: array de **ids** de la colección `/life-events` (esquema `LifeEvent` en `src/schemas/life-event.schema.ts`). El sueño **no** guarda el título ni la fecha del evento; la UI debe cargar el evento por id si hace falta mostrarlo. Válido enlazar el mismo evento en varias sesiones.

## Validación sugerida (API / backend)

- **`dreamKind`**: en `Draft` y `Refining` debe ser `Unknown`; al pasar a `Structured` el usuario confirma o cambia la clasificación (ver `DreamSession` en `src/schemas/dream-session.schema.ts` y `DreamKind` en `src/domain/enums.ts`).
- **Reflexión**: no exigir `ReflectionsDone` para dar por cerrada la sesión si el producto permite terminar en `Structured` sin `userThought`.
- **Catálogo**: `Character.catalogCharacterId` enlaza la aparición onírica con el personaje recurrente en catálogo (análogo a `DreamObject.catalogObjectId`).
- **`relatedLifeEventIds`**: cada id debe existir en `/life-events` (el servidor valida al guardar).

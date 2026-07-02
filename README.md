# API REST Equipment

Backend para registro y seguimiento de equipos durante emergencias en Venezuela.

## Stack

- NestJS 11
- Drizzle ORM 0.45
- PostgreSQL 17
- JWT (passport-jwt) + Google OAuth 2.0 opcional
- Swagger / OpenAPI 3
- Jest 30

## Características

- Arquitectura hexagonal estricta por módulo.
- 7 módulos: `auth`, `users`, `operators`, `equipment`, `equipment-types`, `locations`, `missions`.
- Autenticación JWT con access token (15 min) + refresh token (7 días).
- Google OAuth configurable (se desactiva si no hay credenciales).
- Guards globales: `JwtAuthGuard` y `RolesGuard` (`admin` / `user`).
- Validación con `class-validator` (whitelist + forbidNonWhitelisted).
- Filtro global de excepciones con `errorId` UUID para correlación con logs.
- Documentación Swagger en `/api/docs` con DTOs anotados.
- 237 tests unitarios, cobertura ~93%.

## Estructura del proyecto

```
src/
  app.module.ts              # Composición de módulos + guards globales
  main.ts                    # Bootstrap (puerto + Swagger + log "Server running at: X")
  common/                    # Utilidades compartidas
    decorators/              # @Public, @Roles, @CurrentUser
    filters/                 # GlobalExceptionFilter
    guards/                  # Guards reutilizables
    dto/                     # PaginationDto, PaginationResponseDto
    utils/                   # tryCatch, mapDatabaseError
  auth/                      # Autenticación
    dto/                     # LoginDto, RegisterDto
    guards/                  # JwtAuthGuard, GoogleAuthGuard, RolesGuard
    strategies/              # jwt.strategy, google.strategy
  users/                     # Usuarios
  equipment-types/           # Catálogo de tipos de equipo
  operators/                 # Operadores
  equipment/                 # Equipos
  locations/                 # Ubicaciones geográficas
  missions/                  # Misiones
  database/
    seeds/                   # seed-equipment-types, seed-dev
test/
  app.e2e-spec.ts
  jest.setup.ts              # Variables de entorno para tests
drizzle/                     # Migraciones SQL generadas
```

Cada módulo sigue la convención hexagonal:

```
src/<modulo>/
  schema/<modulo>.schema.ts        # Drizzle schema (PostgreSQL)
  interfaces/                       # Tipos de dominio
  dto/                              # DTOs con class-validator + @ApiProperty
  ports/<modulo>.repository.ts      # Interfaz del repositorio (Symbol token)
  adapters/drizzle-<modulo>.repository.ts  # Implementación con Drizzle
  <modulo>.service.ts
  <modulo>.controller.ts
  <modulo>.module.ts
  <modulo>.service.spec.ts          # Tests del service
  adapters/drizzle-<modulo>.repository.spec.ts  # Tests del adapter
```

## Requisitos

- Node.js 20+
- pnpm 11+
- Docker y Docker Compose (o PostgreSQL 17 local)

## Configuración inicial

1. Instalar dependencias:

```bash
pnpm install
```

2. Copiar plantilla de variables de entorno:

```bash
cp .env.template .env
```

3. Ajustar `.env` con tus credenciales. Variables disponibles:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://equipment:equipment@localhost:5433/apirestequipment` |
| `JWT_SECRET` | Secreto para firmar JWT (obligatorio en producción) | `change-me-in-production` |
| `JWT_EXPIRES_IN` | Vida del access token | `7d` (sobrescrito a `15m` en `auth.module.ts`) |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth (opcional) | vacío |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth (opcional) | vacío |
| `GOOGLE_CALLBACK_URL` | URL de callback de Google | `http://localhost:3000/auth/google/callback` |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno (`development` / `production`) | `development` |

> **Nota:** Si `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` están vacíos, el módulo de Google OAuth se desactiva automáticamente y `GET /api/auth/google` devuelve `401` con mensaje claro.

## Base de datos

```bash
# Iniciar PostgreSQL (requiere sudo si no estás en grupo docker)
sudo docker compose up -d

# Generar migraciones desde los schemas
pnpm run db:generate

# Aplicar migraciones
pnpm run db:migrate

# Seed de tipos de equipo (12 tipos)
pnpm run db:seed

# Seed completo de desarrollo (usuarios, equipment, locations, missions)
npx ts-node -r tsconfig-paths/register src/database/seeds/seed-dev.ts

# Studio visual de Drizzle
pnpm run db:studio
```

**Tablas generadas:** `users`, `equipment_types`, `operators`, `equipment`, `locations`, `missions`.

**Relaciones principales:**

- `equipment.ownerId` → `users.id` (cascade)
- `equipment.operatorId` → `operators.id` (set null)
- `equipment.equipmentTypeId` → `equipment_types.id` (restrict)
- `equipment.currentLocationId` → `locations.id` (set null)
- `locations.equipmentId` → `equipment.id` (cascade)
- `missions.userIdCreator` → `users.id` (restrict)
- `missions.equipmentId` → `equipment.id` (cascade)
- `missions.operatorId` → `operators.id` (set null)
- `operators.userId` → `users.id` (cascade)

## Ejecución

```bash
# Desarrollo con hot-reload
pnpm run start:dev

# Producción
pnpm run build
pnpm run start:prod
```

Al iniciar, verás:

```
[Nest] LOG [Bootstrap] Server running at: 3000
```

La API expone:

- `http://localhost:3000/api/*` — endpoints REST
- `http://localhost:3000/api/docs` — Swagger UI
- `http://localhost:3000/api/docs-json` — OpenAPI JSON

## Endpoints principales

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | Público | Registrar usuario |
| `POST` | `/api/auth/login` | Público | Login con email/password |
| `GET` | `/api/auth/me` | Bearer | Usuario actual |
| `POST` | `/api/auth/refresh` | Bearer | Renovar tokens |
| `GET` | `/api/equipment-types` | Público | Listar tipos de equipo |
| `GET` | `/api/equipment` | Público | Listar equipment con filtros |
| `POST` | `/api/equipment` | Bearer | Crear equipo |
| `GET` | `/api/operators` | Bearer | Listar operadores |
| `GET` | `/api/users` | Admin | Listar usuarios |
| `GET` | `/api/missions` | Público | Listar misiones |
| `POST` | `/api/equipment/:id/locations` | Bearer | Registrar ubicación |

La lista completa está en `/api/docs`.

## Pruebas

```bash
# Unitarios
pnpm run test

# Watch mode
pnpm run test:watch

# Cobertura
pnpm run test:cov

# E2E
pnpm run test:e2e

# Lint
pnpm run lint
```

**Estado actual de tests:** 237 tests, 26 suites, ~93% de cobertura.

## Manejo de errores

Todas las respuestas de error siguen este formato JSON:

```json
{
  "statusCode": 401,
  "message": "Authentication required",
  "errorId": "30acfcce-5dda-4f93-8972-1d5e070fbe16",
  "timestamp": "2026-07-01T02:35:12.927Z",
  "path": "/api/users"
}
```

- `errorId` es un UUID v4 generado por `GlobalExceptionFilter`. Sirve para correlacionar la respuesta con el log del servidor:

  ```bash
  grep "30acfcce-5dda-4f93-8972-1d5e070fbe16" server.log
  ```

- `message` es legible para el cliente.
- `path` indica la URL exacta donde ocurrió.
- `timestamp` en ISO 8601.

## Convenciones

- Código en inglés, mensajes de commit y README en español.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, etc.).
- Cobertura mínima del 60%.
- `tryCatch<T>(p): [T, null] | [null, Error]` para manejo de errores.
- `mapDatabaseError` traduce códigos PostgreSQL a excepciones HTTP:
  - `23505` (unique violation) → `409 Conflict`
  - `23503` / `23502` / `23514` (constraint) → `400 Bad Request`
  - Otros → `500 Internal Server Error`

## Repositorio

- GitHub: https://github.com/pedroobando/apirestequipment
- Rama principal: `main`
- Rama de features: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`

## Autor

Pedro Obando.

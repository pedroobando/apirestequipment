# apirestequipment — Initial Backend Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build the NestJS + Drizzle ORM + PostgreSQL backend for equipment registration and status tracking during the Venezuela emergency response, following the hexagonal architecture pattern from `apirestcondom`.

**Architecture:** Strict ports-and-adapters (hexagonal). Domain logic isolated in services, repositories behind symbols, controllers only handle HTTP. Auth via Passport JWT + Google OAuth. Public read/search endpoints; mutations require authentication.

**Tech Stack:** NestJS 11, Drizzle ORM, PostgreSQL 17 (Docker), class-validator, Passport (JWT + Google), Jest, TypeScript strict + noUncheckedIndexedAccess.

---

## Assumptions

- Project folder: `~/node/backend/apirestequipment`
- Node.js and `pnpm` are available.
- Docker is available for PostgreSQL.
- No existing code; backend will be created from scratch.
- Two roles: `admin`, `user`.
- Code in English; README and user messages in Spanish.
- Conventional Commits in Spanish; no emojis; no Co-Authored-By.

---

## Module Inventory

| Priority | Module | Description |
|----------|--------|-------------|
| 1 | Common | Helpers, error handling, pagination, timestamp schema, base entity interfaces |
| 2 | Database | Docker Compose, Drizzle config, connection provider, migrations runner |
| 3 | Auth | Local email/password + Google OAuth + JWT guards + decorators |
| 4 | Users | User registration, profile, roles |
| 5 | EquipmentTypes | Admin-managed catalog: id, name, isActive |
| 6 | Operators | Drivers/mechanics linked to a user |
| 7 | Locations | Current location + location history for equipment |
| 8 | Equipment | Core module: equipment registration, status, owner, operator, type, current location |
| 9 | Missions | Tasks/assignments where equipment is deployed |
| 10 | API docs / seed | Swagger/OpenAPI, seed data for equipment types |

---

## Phase 0: Project Bootstrap

### Task 0.1: Initialize NestJS project

**Files:**
- Create: `package.json`, `tsconfig.json`, `nest-cli.json`, `.eslintrc.js`, `.prettierrc`, `.gitignore`
- Create: `src/main.ts`, `src/app.module.ts`

**Steps:**
1. Run `pnpm dlx @nestjs/cli@latest new apirestequipment --package-manager pnpm --strict` in `/home/pedro/node/backend/`.
2. Move generated files into `~/node/backend/apirestequipment` if the CLI creates a nested folder.
3. Add dependencies:
   ```bash
   pnpm add @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/swagger @nestjs/passport passport passport-jwt passport-google-oauth20 bcrypt class-validator class-transformer reflect-metadata rxjs drizzle-orm pg
   pnpm add -D @types/node @types/passport-jwt @types/passport-google-oauth20 @types/bcrypt drizzle-kit ts-node tsconfig-paths
   ```
4. Configure `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, `baseUrl: "./"`, `paths: { "src/*": ["src/*"] }`.

**Verify:** `pnpm run build` succeeds.

### Task 0.2: Docker Compose for PostgreSQL

**Files:**
- Create: `docker-compose.yml`

**Content:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:17-alpine
    container_name: apirestequipment-db
    environment:
      POSTGRES_USER: equipment
      POSTGRES_PASSWORD: equipment
      POSTGRES_DB: apirestequipment
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

**Steps:**
1. Run `docker compose up -d`.
2. Add `.env` with `DATABASE_URL=postgresql://equipment:equipment@localhost:5433/apirestequipment`.

**Verify:** `docker ps` shows the container healthy.

### Task 0.3: Drizzle configuration

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/database/database.module.ts`
- Create: `src/database/database.provider.ts` (exports `DATABASE_CONNECTION`)
- Create: `src/database/database.service.ts` (optional: migration runner)
- Create: `src/common/schema/timestamp.ts`

**Content:**
- `drizzle.config.ts` points to `src/**/*.schema.ts` and uses `DATABASE_URL`.
- `DATABASE_CONNECTION` is a symbol provided as `NodePgDatabase`.
- `timestamp.ts` exports `{ createdAt, updatedAt }` columns to reuse in schemas.

**Verify:** `pnpm run db:generate` runs without errors on an empty schema set.

---

## Phase 1: Common Infrastructure

### Task 1.1: Error handling helpers

**Files:**
- Create: `src/common/utils/try-catch.ts`
- Create: `src/common/utils/map-database-error.ts`
- Create: `src/common/filters/global-exception.filter.ts`

**Content:**
- `tryCatch<T>(promise): [T | null, Error | null]`
- `mapDatabaseError(error)` maps Postgres codes `23505` → `ConflictException`, `23503/23502/23514` → `BadRequestException`, others → `InternalServerErrorException`.
- `GlobalExceptionFilter` returns `{ statusCode, message, errorId, timestamp, path }`.

**Verify:** Unit tests for `tryCatch` and `mapDatabaseError` pass.

### Task 1.2: Pagination and common DTOs

**Files:**
- Create: `src/common/dto/pagination.dto.ts`
- Create: `src/common/dto/pagination-response.dto.ts`

**Content:**
- `PaginationDto`: `page` (default 1), `limit` (default 20, max 100).
- `PaginationResponseDto<T>`: `data`, `total`, `page`, `limit`, `totalPages`.

**Verify:** DTO validation passes sample inputs.

### Task 1.3: Roles and auth metadata decorators

**Files:**
- Create: `src/common/enums/role.enum.ts`
- Create: `src/common/decorators/roles.decorator.ts`
- Create: `src/common/decorators/current-user.decorator.ts`

**Content:**
- `Role { Admin = 'admin', User = 'user' }`
- `ROLES_KEY` + `Roles(...roles: Role[])`
- `CurrentUser()` extracts user from request.

---

## Phase 2: Users Module

### Task 2.1: Users schema and interface

**Files:**
- Create: `src/users/schema/users.schema.ts`
- Create: `src/users/interfaces/user.interface.ts`
- Create: `src/users/interfaces/index.ts`

**Content:**
- `users` table: `id uuid pk`, `email text unique not null`, `passwordHash text nullable`, `firstName text`, `lastName text`, `role text default 'user'`, `provider text default 'local'`, `providerId text`, `isActive boolean default true`, `...timestamp`.
- `IUser` interface mirrors the table without framework dependencies.

### Task 2.2: Users repository port and adapter

**Files:**
- Create: `src/users/ports/users.repository.ts`
- Create: `src/users/adapters/drizzle-users.repository.ts`
- Create: `src/users/ports/index.ts`, `src/users/adapters/index.ts`

**Content:**
- `USERS_REPOSITORY_TOKEN` symbol.
- `IUsersRepository`: `findAll`, `findById`, `findByEmail`, `create`, `update`, `remove`, `existsByEmail`.
- Adapter injects `DATABASE_CONNECTION`, uses `tryCatch`, returns `IUser`.

### Task 2.3: Users DTOs

**Files:**
- Create: `src/users/dto/create-user.dto.ts`
- Create: `src/users/dto/update-user.dto.ts`
- Create: `src/users/dto/user-response.dto.ts`
- Create: `src/users/dto/index.ts`

### Task 2.4: Users service

**Files:**
- Create: `src/users/users.service.ts`
- Create: `src/users/users.service.spec.ts`

**Content:**
- Hash password with bcrypt when provider is local.
- Prevent duplicate emails.
- Allow admins to update roles.

### Task 2.5: Users controller

**Files:**
- Create: `src/users/users.controller.ts`
- Create: `src/users/users.module.ts`

**Content:**
- `GET /users` — admin only.
- `GET /users/me` — authenticated user.
- `GET /users/:id` — admin or owner.
- `PATCH /users/:id` — owner or admin.
- `DELETE /users/:id` — admin only.

---

## Phase 3: Auth Module

### Task 3.1: Local auth DTOs and strategy

**Files:**
- Create: `src/auth/dto/login.dto.ts`
- Create: `src/auth/dto/register.dto.ts`
- Create: `src/auth/strategies/local.strategy.ts`
- Create: `src/auth/guards/local-auth.guard.ts`

### Task 3.2: JWT strategy and guard

**Files:**
- Create: `src/auth/strategies/jwt.strategy.ts`
- Create: `src/auth/guards/jwt-auth.guard.ts`
- Create: `src/auth/guards/roles.guard.ts`

### Task 3.3: Google OAuth strategy

**Files:**
- Create: `src/auth/strategies/google.strategy.ts`
- Create: `src/auth/guards/google-auth.guard.ts`

### Task 3.4: Auth service and controller

**Files:**
- Create: `src/auth/auth.service.ts`
- Create: `src/auth/auth.controller.ts`
- Create: `src/auth/auth.module.ts`

**Endpoints:**
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/refresh`
- `GET /auth/me`

**Verify:** Can register a user, login, and access protected route with JWT.

---

## Phase 4: EquipmentTypes Module

### Task 4.1: EquipmentTypes schema and interface

**Files:**
- Create: `src/equipment-types/schema/equipment-types.schema.ts`
- Create: `src/equipment-types/interfaces/equipment-type.interface.ts`

**Content:**
- `equipmentTypes` table: `id uuid pk`, `name text unique not null`, `isActive boolean default true`, `...timestamp`.

### Task 4.2: EquipmentTypes repository, service, controller, module

**Files:**
- Create port, adapter, DTOs, service, controller, module.

**Endpoints:**
- `GET /equipment-types` — public.
- `GET /equipment-types/:id` — public.
- `POST /equipment-types` — admin.
- `PATCH /equipment-types/:id` — admin.
- `DELETE /equipment-types/:id` — admin (soft delete via `isActive = false`).

**Seed:** Insert default types: `truck`, `tow_truck`, `telescopic_crane`, `dump_truck`, `van`, `bus`, `motorcycle`, `car`, `compressor`, `compressor_with_lights`, `machinery`, `other`.

---

## Phase 5: Operators Module

### Task 5.1: Operators schema and interface

**Files:**
- Create: `src/operators/schema/operators.schema.ts`
- Create: `src/operators/interfaces/operator.interface.ts`

**Content:**
- `operators` table: `id uuid pk`, `userId uuid fk -> users`, `licenseNumber text`, `phone text`, `role text` (`driver`, `mechanic`, `operator`), `isActive boolean default true`, `...timestamp`.

### Task 5.2: Operators repository, service, controller, module

**Files:**
- Create port, adapter, DTOs, service, controller, module.

**Endpoints:**
- `GET /operators` — authenticated.
- `GET /operators/:id` — authenticated.
- `POST /operators` — authenticated (creates operator linked to current user or by admin).
- `PATCH /operators/:id` — owner or admin.
- `DELETE /operators/:id` — admin.

---

## Phase 6: Locations Module

### Task 6.1: Locations schema and interface

**Files:**
- Create: `src/locations/schema/locations.schema.ts`
- Create: `src/locations/interfaces/location.interface.ts`

**Content:**
- `locations` table: `id uuid pk`, `equipmentId uuid fk -> equipment`, `latitude decimal not null`, `longitude decimal not null`, `accuracy float`, `source text` (`gps`, `manual`), `recordedAt timestamp default now()`, `...timestamp`.
- `locationHistory` table: same shape but without `updatedAt`; append-only log.

### Task 6.2: Locations repository, service, controller, module

**Files:**
- Create port, adapter, DTOs, service, controller, module.

**Endpoints:**
- `GET /equipment/:equipmentId/locations` — public (latest N).
- `POST /equipment/:equipmentId/locations` — authenticated (owner or admin).
- `GET /equipment/:equipmentId/locations/history` — public.

---

## Phase 7: Equipment Module

### Task 7.1: Equipment schema and interface

**Files:**
- Create: `src/equipment/schema/equipment.schema.ts`
- Create: `src/equipment/interfaces/equipment.interface.ts`

**Content:**
- `equipment` table:
  - `id uuid pk`
  - `ownerId uuid fk -> users`
  - `operatorId uuid nullable fk -> operators`
  - `equipmentTypeId uuid fk -> equipmentTypes`
  - `brand text`
  - `model text`
  - `year int`
  - `plate text`
  - `serialNumber text`
  - `fuelType text` (`gasoline`, `diesel`, `gas`, `electric`)
  - `capacity text` (description of load/capacity)
  - `status text` enum: `available`, `in_use`, `transporting`, `stopped_mecanic`, `stopped_fuel`, `stopped_driver`, `stopped_document`, `stopped_unauthorized`, `out_of_service`
  - `statusReason text`
  - `origin text`, `destination text` (for transporting)
  - `currentLocationId uuid nullable fk -> locations`
  - `isActive boolean default true`
  - `...timestamp`

### Task 7.2: Equipment repository, service, controller, module

**Files:**
- Create port, adapter, DTOs, service, controller, module.

**Endpoints:**
- `GET /equipment` — public (with filters: type, status, near lat/lng).
- `GET /equipment/:id` — public.
- `POST /equipment` — authenticated.
- `PATCH /equipment/:id` — owner or admin.
- `DELETE /equipment/:id` — admin (soft delete).
- `PATCH /equipment/:id/status` — owner or admin (updates status with reason and optional location).

### Task 7.3: Status history

**Files:**
- Create: `src/equipment/schema/equipment-status-history.schema.ts`

**Content:**
- Append-only table: `id`, `equipmentId`, `status`, `reason`, `origin`, `destination`, `recordedAt`.

---

## Phase 8: Missions Module

### Task 8.1: Missions schema and interface

**Files:**
- Create: `src/missions/schema/missions.schema.ts`
- Create: `src/missions/interfaces/mission.interface.ts`

**Content:**
- `missions` table:
  - `id uuid pk`
  - `equipmentId uuid fk -> equipment`
  - `operatorId uuid nullable fk -> operators`
  - `title text not null`
  - `description text`
  - `status text` (`pending`, `active`, `completed`, `cancelled`)
  - `startLocation text`
  - `endLocation text`
  - `startedAt timestamp`, `completedAt timestamp`
  - `createdBy uuid fk -> users`
  - `...timestamp`

### Task 8.2: Missions repository, service, controller, module

**Endpoints:**
- `GET /missions` — public.
- `GET /missions/:id` — public.
- `POST /missions` — admin.
- `PATCH /missions/:id` — admin.
- `DELETE /missions/:id` — admin.
- `PATCH /missions/:id/start` — admin.
- `PATCH /missions/:id/complete` — admin.

---

## Phase 9: Integration & Polish

### Task 9.1: Swagger setup

**Files:**
- Modify: `src/main.ts`

**Content:**
- Configure `@nestjs/swagger` with title `API REST Equipment`, version `1.0`, bearer auth.
- Group public and admin endpoints with tags.

### Task 9.2: Global validation pipe and filters

**Files:**
- Modify: `src/main.ts`

**Content:**
- `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`.
- Use `GlobalExceptionFilter` globally.

### Task 9.3: Seed script

**Files:**
- Create: `src/database/seeds/seed-equipment-types.ts`
- Add: `pnpm run db:seed` script.

### Task 9.4: README

**Files:**
- Create: `README.md`

**Content:**
- Setup instructions (Docker, install, env, migrations, seed, run).
- API overview in Spanish.
- Auth flow description.

---

## Testing Strategy

- Unit tests for each service using Jest, mocking repositories by token.
- Minimum 60% coverage threshold.
- E2E tests for auth and one happy path per critical module.

---

## Open Questions

1. Should Google OAuth flow redirect to a web URL or return a JWT JSON response directly?
2. Should we send email confirmations or keep registration immediate?
3. Should `equipment` search include radius filter (e.g., within X km of lat/lng)?
4. Should missions trigger equipment status changes automatically?

---

## Suggested First Execution Block

Implement Phase 0 (Tasks 0.1–0.3) and Phase 1 (Tasks 1.1–1.3) first. Then proceed module by module: Users → Auth → EquipmentTypes → Operators → Locations → Equipment → Missions.

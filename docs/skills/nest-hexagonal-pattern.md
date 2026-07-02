---
name: nest-hexagonal-pattern
description: "Aplica el patrón de arquitectura hexagonal del proyecto apirestcondom a nuevos módulos/backend NestJS + Drizzle ORM + PostgreSQL."
version: 1.2.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [nestjs, drizzle, postgresql, hexagonal-architecture, ports-and-adapters, backend, typescript]
    related_skills: [plan, test-driven-development, requesting-code-review]
---

# NestJS Hexagonal Pattern (apirestcondom)

Aplica la arquitectura hexagonal estricta usada en `~/node/apirestcondom` a cualquier módulo o backend nuevo construido con **NestJS + Drizzle ORM + PostgreSQL**.

## Cuándo usar este skill

- Se va a crear un nuevo módulo de dominio en un backend NestJS.
- Se quiere estandarizar un módulo siguiendo Puertos y Adaptadores.
- Se está migrando un módulo anémico (service con queries inline) a hexagonal.
- Se inicia un nuevo proyecto backend y se quiere el esqueleto base.

## Principios del patrón

1. **El dominio no depende del framework.**
   - Interfaces (`IEntity`) y DTOs de dominio no importan NestJS ni Drizzle.
2. **Los services dependen de contratos, no de implementaciones.**
   - Usan `@Inject(REPOSITORY_TOKEN)` y trabajan con `IEntityRepository`.
3. **Los controllers solo orquestan HTTP.**
   - No contienen lógica de negocio.
4. **Los guards/ports cruzados importan ports, no Drizzle.**
   - Ej: `MembershipAuthPort`, `PropertyAuthPort`.
5. **Toda query pasa por el adapter.**
   - El service nunca importa `eq`, `sql`, tablas Drizzle, etc.
6. **Transacciones multi-tabla:**
   - El adapter acepta `client?: NodePgDatabase` opcional para propagar el `tx`.
7. **Errores unificados:**
   - `tryCatch<T>()` + `mapDatabaseError()` + `GlobalExceptionFilter`.

## Orden recomendado de módulos cuando se arranca desde cero

Cuando se construye un backend con varios módulos interdependientes, el orden importa porque los módulos posteriores **importan** o **referencian** los anteriores (cross-module). Regla práctica derivada de apirestcondom + apirestequipment:

1. **Common** (helpers, errores, DTOs base, decorators, enums, timestamp).
2. **Database** (provider + connection token).
3. **Users** (no depende de nadie; todos los demás lo referencian).
4. **Auth** (depende de `UsersService` para `findByEmail`, `create`, `getById`).
5. **Catálogos / entidades padre** (ej: `EquipmentTypes`, `Categories`) — los demás módulos los referencian por FK.
6. **Entidades con FK a usuarios o catálogos** (ej: `Operators`, `Equipment`).
7. **Módulos con lógica de eventos / estado** (ej: `Missions`, `Locations`).
8. **Features derivadas** que orquestan varios módulos (ej: endpoints públicos con filtros cruzados).

**Por qué:** NestJS resuelve los imports de `@Module` en `app.module.ts` pero los **servicios** se inyectan en runtime. Si Auth se importa antes que Users y Auth depende de `UsersService`, el primer `pnpm run build` falla con "Can't resolve dependencies" o arranca en orden impredecible. Implementar Users primero evita parches de último momento.

**Síntoma típico de orden incorrecto:** `Nest can't resolve dependencies of the X service. Please make sure that the Y service is available in the current scope.`

## Templates disponibles

En `templates/` hay archivos base listos para reemplazar placeholders. Los placeholders son `<%= entity %>`, `<%= PascalEntity %>`, `<%= UPPER_SNAKE_ENTITY %>`, `<%= tableName %>` (por-módulo) y `<%= projectName %>`, `<%= dbUser %>`, `<%= dbPassword %>`, `<%= dbName %>` (proyecto).

### Por-módulo (un CRUD hexagonal completo)

| Archivo | Destino |
| --- | --- |
| `schema.ts.template` | `src/<entity>/schema/schema.ts` |
| `interface.ts.template` | `src/<entity>/interfaces/<entity>.interface.ts` |
| `create.dto.ts.template` | `src/<entity>/dto/create-<entity>.dto.ts` |
| `update.dto.ts.template` | `src/<entity>/dto/update-<entity>.dto.ts` |
| `repository.port.ts.template` | `src/<entity>/ports/<entity>.repository.ts` |
| `drizzle.repository.ts.template` | `src/<entity>/adapters/drizzle-<entity>.repository.ts` |
| `service.ts.template` | `src/<entity>/<entity>.service.ts` |
| `controller.ts.template` | `src/<entity>/<entity>.controller.ts` |
| `module.ts.template` | `src/<entity>/<entity>.module.ts` |
| `service.spec.ts.template` | `src/<entity>/<entity>.service.spec.ts` |

### De proyecto (esqueleto base)

| Archivo | Destino |
| --- | --- |
| `tsconfig.json.template` | `tsconfig.json` |
| `main.ts.template` | `src/main.ts` |
| `database.provider.ts.template` | `src/database/database.provider.ts` |
| `map-database-error.ts.template` | `src/common/utils/map-database-error.ts` |
| `docker-compose.yml.template` | `docker-compose.yml` |

## Cómo usar este skill

### Opción A: crear un módulo nuevo manualmente

1. Reemplazar en todos los templates:
   - `<%= entity %>` → nombre en kebab-case/plural (ej: `product`, `order-line`).
   - `<%= PascalEntity %>` → PascalCase (ej: `Product`, `OrderLine`).
   - `<%= UPPER_SNAKE_ENTITY %>` → UPPER_SNAKE_CASE para el token (ej: `PRODUCT`, `ORDER_LINE`).
   - `<%= tableName %>` → nombre de tabla en Drizzle (ej: `products`, `orderLines`).
2. Copiar cada template al path destino.
3. Ajustar columnas, FKs, índices, constraints y reglas de negocio.
4. Crear `dto/index.ts` e `interfaces/index.ts` que re-exporten los tipos.
5. Importar `<%= PascalEntity %>Module` en `src/app.module.ts`.
6. Generar migración: `pnpm run db:generate`.
7. Ejecutar migración: `pnpm run db:migrate`.
8. Escribir tests y ejecutar: `pnpm test -- <entity>.service.spec`.
9. Verificar lint: `pnpm run lint`.

### Opción B: crear un módulo con un script de scaffolding

En la raíz del proyecto backend, ejecutar el siguiente script adaptando `ENTITY`, `PASCAL` y `TABLE`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ENTITY="product"               # kebab-case
PASCAL="Product"               # PascalCase
UPPER=$(echo "$ENTITY" | tr '[:lower:]-' '[:upper:]_')  # PRODUCT
TABLE="products"               # plural camelCase en Drizzle

SKILL_DIR="$HOME/.hermes/skills/software-development/nest-hexagonal-pattern/templates"
DEST_DIR="src/$ENTITY"

mkdir -p "$DEST_DIR"/{schema,interfaces,dto,ports,adapters}

render() {
  sed -e "s/<%= entity %>/$ENTITY/g" \
      -e "s/<%= PascalEntity %>/$PASCAL/g" \
      -e "s/<%= UPPER_SNAKE_ENTITY %>/$UPPER/g" \
      -e "s/<%= tableName %>/$TABLE/g"
}

render < "$SKILL_DIR/schema.ts.template"                 > "$DEST_DIR/schema/schema.ts"
render < "$SKILL_DIR/interface.ts.template"              > "$DEST_DIR/interfaces/$ENTITY.interface.ts"
render < "$SKILL_DIR/create.dto.ts.template"             > "$DEST_DIR/dto/create-$ENTITY.dto.ts"
render < "$SKILL_DIR/update.dto.ts.template"             > "$DEST_DIR/dto/update-$ENTITY.dto.ts"
render < "$SKILL_DIR/repository.port.ts.template"        > "$DEST_DIR/ports/$ENTITY.repository.ts"
render < "$SKILL_DIR/drizzle.repository.ts.template"     > "$DEST_DIR/adapters/drizzle-$ENTITY.repository.ts"
render < "$SKILL_DIR/service.ts.template"                > "$DEST_DIR/$ENTITY.service.ts"
render < "$SKILL_DIR/controller.ts.template"             > "$DEST_DIR/$ENTITY.controller.ts"
render < "$SKILL_DIR/module.ts.template"                 > "$DEST_DIR/$ENTITY.module.ts"
render < "$SKILL_DIR/service.spec.ts.template"           > "$DEST_DIR/$ENTITY.service.spec.ts"

cat > "$DEST_DIR/dto/index.ts" <<EOF
export * from './create-$ENTITY.dto';
export * from './update-$ENTITY.dto';
EOF

cat > "$DEST_DIR/interfaces/index.ts" <<EOF
export * from './$ENTITY.interface';
EOF

echo "Módulo creado en $DEST_DIR"
```

Después del scaffolding:

1. Revisar y completar columnas, FKs, validaciones y lógica de negocio.
2. Agregar `<%= PascalEntity %>Module` a `src/app.module.ts`.
3. Generar y correr migraciones.
4. Ejecutar tests y lint.

### Opción C: cambio no trivial (recomendado)

Si el módulo tiene lógica de negocio compleja, relaciones, transacciones o reglas de autorización especiales:

1. Usar el skill `plan` para escribir un plan en `.hermes/plans/YYYY-MM-DD_HHMMSS-<modulo>.md`.
2. Seguir el plan por fases con aprobación humana entre cada fase.
3. Ejecutar cada tarea con TDD (`test-driven-development` skill).
4. Al final, pedir code review (`requesting-code-review` skill).

## Estructura de un módulo

```
src/<entity>/
  schema/
    schema.ts              # Tablas Drizzle + enums + constraints + indexes
  interfaces/
    index.ts
    <entity>.interface.ts  # IEntity puro (dominio)
  dto/
    index.ts
    create-<entity>.dto.ts # DTO de creación (dominio)
    update-<entity>.dto.ts # DTO de actualización
    <entity>-response.dto.ts # Opcional para Swagger
  ports/
    index.ts
    <entity>.repository.ts       # IEntityRepository + TOKEN + DbClient
    <entity>-dependencies.port.ts # Opcional: cross-module ports
  adapters/
    index.ts
    drizzle-<entity>.repository.ts # Implementación con Drizzle
  <entity>.service.ts        # Lógica de negocio
  <entity>.controller.ts     # Endpoints HTTP
  <entity>.module.ts         # Module + binding del token
  <entity>.service.spec.ts   # Tests unitarios
```

## Paso a paso para crear un módulo

### 1. Schema Drizzle

- Crear `src/<entity>/schema/schema.ts`.
- Definir tabla con `pgTable`, columnas, FKs, `onDelete`, `index()`, `unique()`.
- Reutilizar `timestamp` desde `src/common/schema/timestamp`.
- Importar tablas relacionadas solo para referencias FK.
- Nunca importar lógica de negocio en schema.

Ejemplo base:

```ts
import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import { timestamp } from 'src/common/schema/timestamp';

export const products = pgTable('products', {
  id: uuid().primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ...timestamp,
});
```

### 2. Interfaz de dominio

- Crear `src/<entity>/interfaces/<entity>.interface.ts`.
- Solo tipos planos, sin dependencias de framework.

```ts
export interface IProduct {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. DTOs

- Crear `create-<entity>.dto.ts` y `update-<entity>.dto.ts`.
- `CreateEntityDto` es el contrato que recibe el repositorio.
- Si el HTTP recibe campos diferentes (ej: registro), crear un DTO aparte y transformar en service.
- Usar `class-validator` (`@IsString`, `@IsOptional`, `@IsUUID`, etc.).

### 4. Port (contrato del repositorio)

- Crear `src/<entity>/ports/<entity>.repository.ts`.

```ts
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { IProduct } from '../interfaces/product.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const PRODUCT_REPOSITORY_TOKEN = Symbol('PRODUCT_REPOSITORY_TOKEN');
export type DbClient = NodePgDatabase;

export interface IProductRepository {
  findAll(pagination?: PaginationDto): Promise<IProduct[]>;
  findById(id: string): Promise<IProduct | null>;
  create(data: CreateProductDto, client?: DbClient): Promise<IProduct>;
  update(id: string, data: UpdateProductDto): Promise<IProduct>;
  remove(id: string): Promise<IProduct>;
}
```

### 5. Adapter Drizzle

- Crear `src/<entity>/adapters/drizzle-<entity>.repository.ts`.
- Inyectar `DATABASE_CONNECTION`.
- Definir `selectEntity` con `as const` para tipar queries.
- Todos los métodos usan `tryCatch()` y loguean errores.
- El `create()` acepta `client = this.db` para permitir transacciones.

```ts
@Injectable()
export class DrizzleProductRepository implements IProductRepository {
  private readonly logger = new Logger(DrizzleProductRepository.name);

  private readonly selectProduct = {
    id: products.id,
    name: products.name,
    createdAt: products.createdAt,
    updatedAt: products.updatedAt,
  } as const;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async create(data: CreateProductDto, client: NodePgDatabase = this.db): Promise<IProduct> {
    const [result, error] = await tryCatch(
      client.insert(products).values(data).returning(this.selectProduct),
    );
    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw error;
    }
    return result[0]!;
  }
}
```

### 6. Service

- Crear `src/<entity>/<entity>.service.ts`.
- Inyectar el repository por token.
- Validar reglas de negocio antes de llamar al adapter.
- Usar `tryCatch()` para envolver cada llamada async.
- Lanzar excepciones HTTP apropiadas (`NotFoundException`, `ConflictException`, `BadRequestException`, `InternalServerErrorException`).
- Normalizar datos (emails a minúscula, trims, etc.) en el service.

```ts
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @Inject(PRODUCT_REPOSITORY_TOKEN)
    private readonly productRepository: IProductRepository,
  ) {}

  async findById(id: string): Promise<IProduct> {
    const [product, error] = await tryCatch(this.productRepository.findById(id));
    if (error) {
      this.logger.error(`findById - ${error.message}`);
      throw new BadRequestException(`Error buscando producto ${id}`);
    }
    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return product;
  }
}
```

### 7. Controller

- Crear `src/<entity>/<entity>.controller.ts`.
- Usar decoradores NestJS.
- Aplicar guards con `@Auth()` y `@CondoAuth(...)` si aplica.
- Solo orquesta: recibe DTO, llama service, devuelve resultado.

### 8. Module

- Crear `src/<entity>/<entity>.module.ts`.
- Exportar solo lo necesario.
- Hacer binding del token al adapter.

```ts
@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [ProductController],
  providers: [
    ProductService,
    {
      provide: PRODUCT_REPOSITORY_TOKEN,
      useClass: DrizzleProductRepository,
    },
  ],
  exports: [ProductService],
})
export class ProductModule {}
```

### 9. Importar en AppModule

Agregar `ProductModule` a `AppModule.imports`.

### 10. Tests unitarios

- Crear `<entity>.service.spec.ts`.
- Mockear el repository por token.
- Probar happy path, not found, errores de negocio.

```ts
const mockRepo = {
  findById: jest.fn(),
  create: jest.fn(),
};

const module: TestingModule = await Test.createTestingModule({
  providers: [
    ProductService,
    { provide: PRODUCT_REPOSITORY_TOKEN, useValue: mockRepo },
  ],
}).compile();
```

## Cross-module dependencies (ports)

Si un módulo necesita datos de otro sin romper hexagonal:

1. Definir un **port** en `src/<entity>/ports/<entity>-dependencies.port.ts`:

```ts
export const USER_DEPENDENCIES_TOKEN = Symbol('USER_DEPENDENCIES_TOKEN');

export interface UserDependenciesPort {
  userHasProperties(userId: string): Promise<boolean>;
}
```

2. Implementarlo en el módulo propietario:

```ts
@Injectable()
export class PropertyUserDependencies implements UserDependenciesPort {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async userHasProperties(userId: string): Promise<boolean> {
    return this.propertyRepository.countByUserId(userId).then((n) => n > 0);
  }
}
```

3. Proveerlo en el module del propietario:

```ts
{ provide: USER_DEPENDENCIES_TOKEN, useClass: PropertyUserDependencies }
```

4. Inyectarlo en el service consumidor:

```ts
@Inject(USER_DEPENDENCIES_TOKEN) private readonly userDependencies: UserDependenciesPort
```

## Manejo de errores

Usar siempre el stack establecido:

1. **tryCatch** envuelve cada promesa en services y adapters.
2. **mapDatabaseError** traduce errores Postgres:
   - `23505` → `ConflictException`
   - `23503`, `23502`, `23514` → `BadRequestException`
   - otros → `InternalServerErrorException`
3. **GlobalExceptionFilter** formatea la respuesta final:

```json
{
  "statusCode": 404,
  "message": "Recurso no encontrado",
  "errorId": "uuid-v4",
  "timestamp": "2026-06-29T12:00:00.000Z",
  "path": "/api/products/123"
}
```

## Transacciones

Si una operación toca más de una tabla:

1. El método del adapter acepta `client?: DbClient`.
2. El service que orquesta abre `this.db.transaction(async (tx) => { ... })`.
3. Pasa `tx` como `client` a cada repositorio.

Ejemplo:

```ts
async createOrder(data: CreateOrderDto): Promise<IOrder> {
  return this.db.transaction(async (tx) => {
    const order = await this.orderRepository.create(data, tx);
    await this.orderLineRepository.createMany(order.id, data.lines, tx);
    return order;
  });
}
```

## Guards hexagonales

Si un guard necesita datos de otro módulo, no importe Drizzle; inyecte un port:

```ts
@Injectable()
export class CondoAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(MEMBERSHIP_AUTH_TOKEN)
    private readonly membershipAuth: MembershipAuthPort,
  ) {}
}
```

## Guards globales (Auth + Roles) con opt-out por decorador

Patrón recomendado cuando toda la API requiere auth por defecto:

1. Declarar guards globales en `AppModule` con `APP_GUARD`:
   ```ts
   providers: [
     { provide: APP_GUARD, useClass: JwtAuthGuard },
     { provide: APP_GUARD, useClass: RolesGuard },
   ]
   ```
2. En el `JwtAuthGuard`, leer `IS_PUBLIC_KEY` con `Reflector` y hacer bypass:
   ```ts
   canActivate(context: ExecutionContext) {
     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
       context.getHandler(), context.getClass(),
     ]);
     if (isPublic) return true;
     return super.canActivate(context);
   }
   ```
3. Marcar endpoints públicos con `@Public()` (decorador trivial que hace `SetMetadata(IS_PUBLIC_KEY, true)`).
4. En el `RolesGuard`, leer `ROLES_KEY` y comparar con `request.user.role`. Si no hay roles requeridos, dejar pasar.

Este patrón evita tener que declarar `@UseGuards(JwtAuthGuard)` en cada controller y centraliza la lógica de auth.

## Cross-module: importar un service (sin romper hexagonal)

Si el módulo A necesita el service del módulo B (no solo datos), **importar el módulo** es válido y no rompe hexagonal. Ejemplo típico: `AuthModule` necesita `UsersService` para registrar/buscar usuarios, o `MissionsService` necesita `EquipmentService` para validar que el equipo existe antes de crear una misión.

```ts
// auth.module.ts
@Module({
  imports: [UsersModule],  // UsersModule debe exportar UsersService
  ...
})
export class AuthModule {}
```

```ts
// missions.module.ts
@Module({
  imports: [EquipmentModule],  // EquipmentModule debe exportar EquipmentService
  ...
})
export class MissionsModule {}
```

Hexagonal se rompe solo si importas el adapter (Drizzle, TypeORM) directamente. Importar un service de otro módulo está permitido.

### Pattern: mission/task with creator FK and single equipment

A common domain request is "the user who created the mission/task must be recorded, and one mission is assigned to one equipment". This is a straightforward 1:N relationship, not many-to-many.

Schema shape:

```ts
export const missions = pgTable(
  'missions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userIdCreator: uuid('user_id_creator').notNull(),
    equipmentId: uuid('equipment_id').notNull(),
    operatorId: uuid('operator_id'),
    title: text('title').notNull(),
    description: text('description'),
    origin: text('origin'),
    destination: text('destination'),
    status: text('status').notNull().default('pending'),
    startedAt: pgTimestamp('started_at', { withTimezone: true }),
    completedAt: pgTimestamp('completed_at', { withTimezone: true }),
    ...timestampColumns,
  },
  (table): ForeignKeyBuilder[] => [
    foreignKey({
      name: 'missions_user_id_creator_fk',
      columns: [table.userIdCreator],
      foreignColumns: [users.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'missions_equipment_id_fk',
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'missions_operator_id_fk',
      columns: [table.operatorId],
      foreignColumns: [operators.id],
    }).onDelete('set null'),
  ],
);
```

Service checks:
- Validate `equipmentId` exists (import `EquipmentModule` / `EquipmentService`).
- Validate status transitions (`pending` → `in_progress` → `completed`/`cancelled`).
- Set `startedAt` automatically when status moves to `in_progress`.
- Set `completedAt` automatically when status moves to `completed`.

If a future requirement asks "several equipments in the same area", that is an **area/coverage** concern, not a change to the mission-equipment relationship. Keep the 1:N and add the area concept separately.

### Testing de services con cross-module dependencies

Cuando un service inyecta otro service de un módulo importado, en el spec unitario **no mockees el service completo por string** (ej. `{ provide: 'EquipmentService', useValue: mockEquipmentService }`). En su lugar, provee la clase real y mockea **su dependencia interna** (el repository token que usa):

```ts
import { MissionsService } from './missions.service';
import { MISSIONS_REPOSITORY_TOKEN } from './ports/missions.repository';
import { EquipmentService } from 'src/equipment/equipment.service';
import { EQUIPMENT_REPOSITORY_TOKEN } from 'src/equipment/ports/equipment.repository';

const module: TestingModule = await Test.createTestingModule({
  providers: [
    MissionsService,
    EquipmentService,  // clase real
    {
      provide: MISSIONS_REPOSITORY_TOKEN,
      useValue: mockMissionsRepository,
    },
    {
      provide: EQUIPMENT_REPOSITORY_TOKEN,
      useValue: mockEquipmentRepository,
    },
  ],
}).compile();
```

De esta forma el `EquipmentService` funciona con su lógica real, pero el adapter de Drizzle está mockeado. Esto evita errores como:

```
Nest can't resolve dependencies of the MissionsService (Symbol(MISSIONS_REPOSITORY_TOKEN), ?).
Please make sure that the argument EquipmentService at index [1] is available in the current scope.
```

Si solo quieres validar que se llamó a `equipmentService.getRawById()`, puedes usar `jest.spyOn(equipmentService, 'getRawById')` después de obtener la instancia del módulo.

## Convenciones del proyecto

- TypeScript `strict` + `noUncheckedIndexedAccess`.
- Código (variables, tipos, comentarios) en **inglés**.
- README y mensajes al usuario en **español**.
- Commits con [Conventional Commits](https://www.conventionalcommits.org/) en español.
- Sin emojis en código ni commits.
- Sin `Co-Authored-By` en commits.
- Cobertura mínima 60% en tests unitarios.

## Pitfalls de TypeScript / NestJS 11 (encontrados en uso real)

### Comparación entre `string` y enum en runtime

Si la interfaz de dominio declara `status: string` (porque Drizzle devuelve string) pero usas un `enum` para valores conocidos, las comparaciones directas `value === MissionStatus.Completed` pueden fallar en lint con `@typescript-eslint/no-unsafe-enum-comparison` cuando TS no puede unificar ambos tipos.

**Opciones (preferir la primera en services/adapters):**

1. Comparar con el valor del enum usando `.valueOf()`:
   ```ts
   if (mission.status === MissionStatus.Completed.valueOf()) { ... }
   ```

2. Declarar la interfaz con el tipo del enum si estás seguro de que todos los strings mapean a valores del enum, pero entonces tendrás que hacer cast en el adapter Drizzle.

3. Usar constants string (`const MISSION_COMPLETED = 'completed'`) en vez de enum para evitar la fricción de tipos.

La razón del problema: `enum` en TS genera un objeto con direcciones bidireccionales (clave → valor y valor → clave), y cuando se compara `string` contra un miembro del enum, el linter advierte sobre la comparación insegura. `.valueOf()` devuelve el string subyacente y satisface la regla.

### `isolatedModules` + tipos en firmas con decoradores

Con `isolatedModules: true` y `emitDecoratorMetadata: true` (configuración por defecto de NestJS 11), TypeScript exige `import type` para cualquier **tipo** que aparezca en una firma decorada:

```ts
// MAL — error TS1272
import { CurrentUser, AuthenticatedUser } from 'src/common/decorators/current-user.decorator';
findMe(@CurrentUser() user: AuthenticatedUser) {}

// BIEN
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/common/decorators/current-user.decorator';
findMe(@CurrentUser() user: AuthenticatedUser) {}
```

Lo mismo aplica al inyectar repositorios:

```ts
// MAL
import { IUsersRepository, USERS_REPOSITORY_TOKEN } from './ports/users.repository';

// BIEN
import { USERS_REPOSITORY_TOKEN } from './ports/users.repository';
import type { IUsersRepository } from './ports/users.repository';
```

### `noUncheckedIndexedAccess` + DTOs con class-validator

Con `noUncheckedIndexedAccess: true`, los DTOs con campos requeridos rompen el build porque TS reporta "Property has no initializer and is not definitely assigned". NestJS espera que class-validator asigne los campos vía `transform: true`. Hay dos soluciones, preferir la primera:

1. **Recomendado:** agregar en `tsconfig.json`:
   ```json
   "strictPropertyInitialization": false
   ```
2. Alternativa: inicializar todos los campos con `''` o `undefined as any` (ensucia los DTOs).

### `ValidationPipe` en NestJS 11

La propiedad cambió. El viejo `enableImplicitConversions: true` ya no existe en `ValidationPipeOptions`. Usar:

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
})
```

### `mapDatabaseError` retornar `Error` en vez de `throw`

Con `@typescript-eslint/only-throw-error` activo, declarar `mapDatabaseError(error): never` y hacer `throw new ConflictException(...)` adentro produce 6+ errores de lint porque el linter no rastrea bien el control flow desde un `never`. Solución probada: la función **retorna** el `Error` y el caller hace `throw`:

```ts
export function mapDatabaseError(error: Error | null | undefined): Error {
  if (!error) return new InternalServerErrorException('Database operation failed');
  switch ((error as PostgresError).code) {
    case '23505': return new ConflictException('Resource already exists');
    case '23503':
    case '23502':
    case '23514': return new BadRequestException(error.message);
    default: return new InternalServerErrorException('Database operation failed');
  }
}

// En el adapter:
if (error || !result) {
  this.logger.error(...);
  throw mapDatabaseError(error ?? undefined);  // <- el throw va aquí
}
```

### Jest no resuelve `src/*` por defecto

`tsconfig.json` con `paths: { "src/*": ["src/*"] }` funciona para `nest build` y para el runtime, pero **Jest no lo lee**. Hay que agregar `moduleNameMapper` en `package.json`:

```json
"jest": {
  "rootDir": "src",
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/$1"
  }
}
```

### bcrypt + Jest: no usar `jest.spyOn(bcrypt, 'hash')`

`jest.spyOn` sobre `bcrypt.hash` falla con `Cannot redefine property: hash` porque bcrypt ya está parcheado por otro código. Para testear la lógica de hashing, **testear el resultado** (que `updateData` recibe el hash) sin spyOn sobre bcrypt. Si necesitas mockear, mockear el módulo completo con `jest.mock('bcrypt')` o aislar el hashing detrás de un port.

### Swagger + `setGlobalPrefix('api')`

Si defines `app.setGlobalPrefix('api')`, la ruta de Swagger debe ser explícita y no chocar:

```ts
app.setGlobalPrefix('api');
SwaggerModule.setup('api/docs', app, document);  // accesible en /api/docs
```

Si Swagger queda en raíz (`/docs`) mientras los endpoints están en `/api`, los tests con supertest rompen por path mismatch.

### Drizzle: columnas `decimal` no aceptan `number` en `.values()`

Drizzle espera string para columnas `decimal` (precision/scale). Si el DTO recibe `number`, convertir antes de insertar:

```ts
client.insert(locations).values({
  latitude: data.latitude.toString(),   // no pasar number
  longitude: data.longitude.toString(),
  // ...
})
```

Si se pasa number, TS se queja pero el error solo aparece en tiempo de query, no en build. Asegurarse de hacer la conversión explícita.

### Drizzle: `number | undefined` no es asignable a `.limit()`

`query.limit` con DTO que tiene `IsOptional` es `number | undefined`. `.limit()` requiere `number`. Usar fallback:

```ts
.limit(query.limit ?? 50)
```

### Arrancar el servidor Nest en background desde un agente: `node dist/src/main.js`, no `pnpm run start`

`pnpm run start` ejecuta `nest start` (modo no-watch). En algunos entornos de agente (donde el proceso se lanza con `terminal(background=true)`), `nest start` no permanece vivo como daemon — el shell lo trata como foreground, el wrapper termina y la sesión queda colgada sin servidor.

**Patrón que sí funciona de forma fiable:**

```bash
# Compilar una vez
pnpm run build

# Lanzar el dist compilado en background
terminal(command="node dist/src/main.js",
         background=true,
         workdir="/path/to/project")
```

**Dos detalles que ahorran tiempo:**

1. **Ruta del compiled output.** Con la config por defecto de Nest CLI (`rootDir: "src"`), `nest build` emite bajo `dist/src/main.js`, NO `dist/main.js`. Si `node dist/main.js` falla con `Cannot find module '/.../dist/main.js'`, prueba `node dist/src/main.js`. Verifica siempre con `ls dist/src/main.js` antes de tirar el error.
2. **No es watch mode.** Si necesitas live reload, usa `pnpm run start:dev` (que sí es `nest start --watch`) pero lánzalo igual vía `node dist/src/main.js` o usando `tee` para capturar logs en `/tmp/server.log`. Recuerda que el watch mode **no recarga cambios en `.env`** — hay que matar y relanzar el proceso.

**Verificación tras arrancar:**

```bash
sleep 4 && curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/api/<some-endpoint>
```

Si devuelve el código HTTP esperado, el servidor está vivo. Si no, `process(action="log", session_id=...)` para ver el output capturado.

### Drizzle: el campo en `.values()` debe ser el nombre JS, no la columna SQL

Cuando el schema define `passwordHash: text('password_hash')`, el primer token es el **nombre del campo en el schema JS** y es lo que Drizzle usa en `.values({...})` y en los tipos TypeScript. El segundo token (`'password_hash'`) es solo el nombre de la columna SQL. Pasar `password: ...` no rellena nada; la columna queda NULL.

**Trampa clásica (encontrada en apirestequipment 06-30):** el service hashea `data.password` y pasa `password: passwordHash` al adapter, mientras el schema tiene `passwordHash`. El endpoint `register` no falla (no verifica el hash), pero el siguiente `login` devuelve 401 porque `bcrypt.compare` se llama contra `null`.

**Regla:** si el service transforma un campo (hashea, encripta, normaliza), el resultado va en el campo del **schema JS**, no en el campo del DTO. Si el DTO no tiene el campo del schema, crear un tipo intermedio en el port:

```ts
export type CreateUserData = Omit<CreateUserDto, 'password'> & {
  passwordHash: string;
};
```

**Verificación rápida después de un fix de este tipo:** ejecutar `register` con un usuario nuevo, luego `login` con las mismas credenciales. Si login devuelve tokens, el hash está persistido correctamente.

### Drizzle: `result[0]` con `noUncheckedIndexedAccess`

Con `noUncheckedIndexedAccess: true`, `result[0]` es `T | undefined`. Usar non-null assertion `result[0]!` SOLO cuando se garantiza que el array tiene al menos un elemento (caso típico: `returning()` después de un insert/update).

## Drizzle schema circular references

**Problem:** When two schema files import each other for foreign keys (e.g. `equipment.schema.ts` imports `locations`, and `locations.schema.ts` imports `equipment`), TypeScript may infer Drizzle columns as `any` and the build fails with cryptic type errors.

**Solutions (pick one):**

1. **Avoid bidirectional FKs.** Keep FKs in the direction that matches the dominant relationship. Example: if `locations` belongs to `equipment`, let `locations` hold the `equipmentId` FK and do not add a hard FK from `equipment.currentLocationId` back to `locations`.

2. **If you need both directions**, add explicit type annotations to the `foreignKey` callback so TypeScript does not depend on circular inference:

```ts
import {
  pgTable,
  uuid,
  foreignKey,
  type ForeignKeyBuilder,
} from 'drizzle-orm/pg-core';

export const equipment = pgTable(
  'equipment',
  {
    id: uuid().primaryKey().defaultRandom(),
    ownerId: uuid().notNull(),
    // ...
  },
  (table): ForeignKeyBuilder[] => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [users.id],
    }),
  ],
);
```

Using `(table): ForeignKeyBuilder[] => [...]` short-circuits circular type inference and keeps the schema buildable.

### Real-world pattern: current location with hard FK

When `equipment` must expose a `currentLocationId` that points to the latest row in `locations`, and `locations` already has an `equipmentId` FK back to `equipment`, you get a bidirectional FK. This is valid and buildable if both schemas use explicit `ForeignKeyBuilder[]` annotations.

Recommended model:

```ts
// src/locations/schema/locations.schema.ts
export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    equipmentId: uuid('equipment_id').notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    accuracy: real('accuracy'),
    source: text('source').notNull().default('manual'),
    recordedAt: pgTimestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
    ...timestampColumns,
  },
  (table): ForeignKeyBuilder[] => [
    foreignKey({
      name: 'locations_equipment_id_fk',
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
    }).onDelete('cascade'),
  ],
);

// src/equipment/schema/equipment.schema.ts
export const equipment = pgTable(
  'equipment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull(),
    operatorId: uuid('operator_id'),
    equipmentTypeId: uuid('equipment_type_id').notNull(),
    currentLocationId: uuid('current_location_id'),
    // ... other fields
    ...timestampColumns,
  },
  (table): ForeignKeyBuilder[] => [
    foreignKey({
      name: 'equipment_owner_id_fk',
      columns: [table.ownerId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'equipment_current_location_id_fk',
      columns: [table.currentLocationId],
      foreignColumns: [locations.id],
    }).onDelete('set null'),
    // ... other FKs
  ],
);
```

Key points:
- Keep `locations.equipmentId` so every location row knows which equipment produced it (historical track).
- Use `equipment.currentLocationId` only as a pointer to the most recent `locations` row.
- Do **not** create a separate `location_history` table if `locations` already stores all historical points; it duplicates data and complicates writes.
- When a new location is recorded, insert into `locations` and then update the matching `equipment.currentLocationId` in the same transaction.

### Areas / coverage zones vs. precise locations

A `location` is a precise point belonging to one equipment. An "area" or "coverage zone" is a separate concept: a center point + radius inside which many equipments may be. Do not conflate the two by removing `equipmentId` from `locations`. If the product needs areas, add a dedicated `areas` module later and query equipments whose latest location falls inside the radius.

### Pitfall: confirm relationship cardinality before coding

When a user says "missions have equipment" or "tasks have equipment", the default assumption is **one mission/task → one equipment** (1:N). If they later say "even several equipments can be assigned to the same mission", stop and reconfirm before switching to a join table. In this session the user clarified that "several equipments in the same area" is an **area/coverage** concern, not a many-to-many mission-equipment relationship.

**Rule:** before introducing a join table, ask explicitly:
- Does one mission/task need to reference multiple equipments simultaneously?
- Or is the requirement that multiple equipments can be *near* the same geographic area?

Only the first case justifies `mission_assignments`. The second case is solved by an `areas` module or a radius query over `locations`.

---

## Unit testing error branches in services and adapters

Services that use `tryCatch()` have two outcomes per repository call: success and error. Coverage gaps almost always come from the error branches. Add at least one error test per service method that calls a repository.

**Pattern for service error tests:**

```ts
it('should propagate repository errors', async () => {
  const dbError = new Error('findAll db error');
  mockRepository.findAll.mockRejectedValue(dbError);

  await expect(service.findAll({ page: 1, limit: 20 })).rejects.toThrow(
    dbError,
  );
});
```

For cross-module services (e.g. `MissionsService` depends on `EquipmentService`), test the imported service's failure path too:

```ts
it('should propagate equipment lookup errors', async () => {
  const dbError = new Error('equipment not found');
  mockEquipmentRepository.findById.mockRejectedValue(dbError);

  await expect(service.create(dto)).rejects.toThrow(dbError);
});
```

**Pattern for adapter error tests:**

Adapter methods wrap Drizzle calls with `tryCatch()` and throw `mapDatabaseError(...)`. To test failure, make the terminal chain method reject:

```ts
mockDb.select.mockReturnValue({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      limit: jest.fn().mockRejectedValue(new Error('db error')),
    }),
  }),
});

await expect(repository.findById('uuid')).rejects.toThrow();
```

**Important:** when asserting on thrown errors from `mapDatabaseError`, the thrown error is an `HttpException` (e.g. `InternalServerErrorException`). Use `rejects.toThrow()` without a message match unless you know the exact mapped error.

---

## Unit testing controllers

Controller specs are cheap and raise overall coverage quickly. They only need the service mocked.

```ts
const mockService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const module: TestingModule = await Test.createTestingModule({
  controllers: [ProductController],
  providers: [{ provide: ProductService, useValue: mockService }],
}).compile();
```

Test each route once. Pay attention to `@Query()` coercion (e.g. `isActive: string` parsed to boolean) and `@Param('id', ParseUUIDPipe)`.

---

## Unit testing Drizzle adapters

Hexagonal adapters that inject `DATABASE_CONNECTION` can be unit-tested without a real database by mocking the Drizzle query builder chain.

**Pattern:** create a mock with every chained method returning `this`, and the terminal method (`returning`, `limit`, etc.) resolving the expected value:

```ts
const createMockDb = () => ({
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mockEntity]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});
```

For `findAll` you typically need two `select` calls (items + count). Return distinct query objects for each call:

```ts
mockDb.select
  .mockReturnValueOnce(itemsQuery)
  .mockReturnValueOnce(countQuery);
```

Keep adapter specs focused on "did the right chain get called and did it return the mapped entity?" rather than asserting exact SQL strings.

---

## Jest setup file for environment-dependent strategies

Strategies or guards that read `process.env['GOOGLE_CLIENT_ID']`, `JWT_SECRET`, etc. at import time will fail in tests if the env var is missing. Instead of setting env vars inside each spec, create a central setup file:

`test/jest.setup.ts`:
```ts
process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['GOOGLE_CLIENT_ID'] = 'test-google-client-id';
process.env['GOOGLE_CLIENT_SECRET'] = 'test-google-client-secret';
```

Wire it in `package.json`:
```json
"jest": {
  "setupFilesAfterEnv": ["../test/jest.setup.ts"],
  "testEnvironment": "node"
}
```

This keeps individual specs clean and avoids import-time failures for OAuth/passport strategies.

Ver también `references/jest-testing-patterns.md` para session-tested patterns on controller specs, cross-module service mocking, and adapter error-branch testing, y `references/standalone-scripts-and-optional-providers.md` para `.env` loading en seed scripts, registro condicional de providers (ej: Google OAuth cuando falta env), y el gotcha de `process.env` en call-time vs import-time, y `references/session-apirestequipment-2026-06-30-part2.md` para la receta end-to-end de verificación tras un fix estilo `passwordHash`, la aclaración MCP-for-Hermes-vs-for-OpenCode, y el gotcha de arranque en background con `node dist/src/main.js`. Ver `references/apirestequipment-shared-postgres-setup.md` para apuntar la app a un contenedor Postgres compartido existente (variante "no dedicado" del bootstrap), y `references/apirestequipment-dedicated-postgres-setup.md` para el caso inverso: contenedor propio (`pgEquip` con su propio `docker-compose.yml`, vars en `.env`, user dedicado, puerto 5432). Esta segunda variante documenta además la trampa del filtro de redacción de secretos al escribir `.env`/`.env.template` — si ves `***` en el `cat` y dudás si el archivo está roto, `od -c` y `md5sum` son la verdad. Ver `references/session-apirestequipment-2026-07-02.md` para el commit del fix `passwordHash` (CreateUserData/UpdateUserData) que llevaba abierto desde el 06-30, la receta de verificación post-arranque (curl al puerto cuando `process(log)` se queda congelado por buffering en non-TTY), y la nota sobre la coexistencia de `.env` real (necesario para el `docker-compose.yml`) con la convención `.env.template` de Pedro. Ver `references/session-apirestequipment-2026-07-02-part2.md` para la parte 2 de esa misma sesión: `pnpm db:seed` está roto y el workaround con `node -r ts-node/register -r tsconfig-paths/register`, el patrón de agregar un admin custom al seed (con su propio `bcrypt.hash` separado), los response shapes reales de la API (`/auth/login` solo tokens, `findAll` envuelto en `{data,total,page,limit,totalPages}`), y el workflow correction de Pedro: cuando Docker es inalcanzable desde el agente, leer `docker-compose.yml` + `.env` y verificar liveness por TCP, no intentar forzar `sudo docker ps`.

---

## Coverage configuration for hexagonal NestJS projects

Reaching 60%+ coverage is easier and more honest when the coverage scope is aligned with testable business logic. DTOs, schemas, interfaces, modules, controllers, decorators, filters, and enums are usually exercised indirectly or are pure declarations.

Recommended `collectCoverageFrom` in `package.json`:

```json
"collectCoverageFrom": [
  "**/*.(t|j)s",
  "!**/*.dto.ts",
  "!**/*.schema.ts",
  "!**/*.interface.ts",
  "!**/*.module.ts",
  "!**/*.controller.ts",
  "!**/main.ts",
  "!**/*.enum.ts",
  "!**/*.decorator.ts",
  "!**/*.filter.ts",
  "!**/database/**",
  "!**/node_modules/**"
]
```

This focuses coverage on services, adapters, guards, strategies, and utils — the units that contain real conditional logic.

---

### pnpm 11 + `allowBuilds` en workspace

`pnpm-workspace.yaml` con `allowBuilds` exige estructura estricta. Cuidado con paquetes `@scoped/name`:

```yaml
# MAL — falla al parsear
allowBuilds:
  '@scarf/scarf': true
  bcrypt: true

# BIEN
allowBuilds:
  "@scarf/scarf": true
  bcrypt: true
  unrs-resolver: true
```

Si el primer `pnpm install` falla por builds ignorados (`unrs-resolver`, `bcrypt`, `esbuild`, `@scarf/scarf` en proyectos NestJS típicos), agregar el bloque arriba antes del segundo `install`.

## Swagger: hacer que los DTOs muestren campos en `/api/docs`

**Problema:** los DTOs con solo decoradores de `class-validator` (`@IsString`, `@IsEmail`, etc.) aparecen **vacíos** en Swagger UI — los schemas del OpenAPI generado no exponen `properties` ni `required`. Esto rompe la documentación generada y obliga al consumidor a leer el código fuente.

**Causa:** Swagger necesita metadata adicional para inferir tipos. La forma "automática" es el plugin CLI de `@nestjs/swagger`, pero **con `pnpm` + NestJS 11 el plugin no se aplica** incluso cuando está bien configurado en `nest-cli.json`:

```jsonc
// nest-cli.json — ESTO PARECE CORRECTO PERO NO SE EJECUTA
"compilerOptions": {
  "plugins": [
    {
      "name": "@nestjs/swagger",
      "options": { "classValidatorShim": true, "introspectComments": true }
    }
  ]
}
```

Síntomas de que el plugin no corrió:
- `pnpm run build` termina sin errores pero los `dist/**/*.d.ts` no contienen `ApiProperty`.
- `curl /api/docs-json` devuelve los DTOs como `{ "type": "object" }` sin `properties`.
- `find dist -name "*.metadata.json"` está vacío.

**Solución probada (manual, garantizada):** agregar `@ApiProperty()` / `@ApiPropertyOptional()` a cada campo de cada DTO. Es trabajo extra, pero funciona al 100% y deja ejemplos visibles en Swagger.

```ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+584****4567' })
  @IsOptional()
  @IsString()
  phone?: string;
}
```

Para enums, agregar `enum: [...]` con los valores válidos:

```ts
@ApiProperty({
  example: 'in_progress',
  enum: ['pending', 'in_progress', 'completed', 'cancelled'],
})
@IsString()
status: string;
```

**Verificación rápida tras aplicar:**

```bash
pnpm run build && pnpm run start &
sleep 5
curl -sS http://localhost:3000/api/docs-json | python3 -c "
import json, sys
d = json.loads(sys.stdin.read())
schemas = d.get('components', {}).get('schemas', {})
for key in ['CreateUserDto', 'CreateEquipmentDto', 'LoginDto']:
    props = schemas.get(key, {}).get('properties', {})
    required = schemas.get(key, {}).get('required', [])
    print(f'{key}: {len(props)} fields, required={required}')
"
```

Salida esperada: `CreateUserDto: 5 fields, required=['email', 'password', 'firstName', 'lastName']`. Si muestra `0 fields`, el plugin CLI tampoco está funcionando y todavía falta agregar `@ApiProperty()`.

**Alternativa no recomendada:** migrar a webpack/swc como bundler para que el plugin CLI se cargue correctamente. Es más invasivo que agregar `@ApiProperty()` a mano.

**Gotcha:** los DTOs que se usan en `@Query()` con `class-transformer` (ej: `PaginationDto`) a veces no se referencian en el OpenAPI aunque tengan `@ApiPropertyOptional`. Si el spec los ignora, exponerlos manualmente en el controller con `@ApiQuery({ type: PaginationDto })`.

## Bootstrap de un proyecto nuevo (desde cero)

Si no hay proyecto base, seguir este orden antes de crear el primer módulo:

1. **Scaffold con Nest CLI:** `pnpm dlx @nestjs/cli@latest new <name> --package-manager pnpm --strict`.
2. **Permitir builds nativos en pnpm:** si aparece `[ERR_PNPM_IGNORED_BUILDS]`, agregar al `pnpm-workspace.yaml`:
   ```yaml
   allowBuilds:
     esbuild: true
     bcrypt: true
   ```
   Luego volver a correr `pnpm install`.
3. **TypeScript strict:** asegurar `strict: true` y `noUncheckedIndexedAccess: true` en `tsconfig.json`; usar `process.env['VAR']` en vez de `process.env.VAR` para evitar index-access errors.
4. **Docker PostgreSQL:** crear `docker-compose.yml` con healthcheck y mapear puerto no estándar (ej: `5433:5432`) para evitar colisiones.
5. **Drizzle:** crear `drizzle.config.ts` con `schema: './src/**/*.schema.ts'` y scripts `db:generate`, `db:migrate`, `db:seed`.
6. **Common primero:** antes de cualquier módulo, crear `src/common/utils/try-catch.ts`, `src/common/utils/map-database-error.ts`, `src/common/filters/global-exception.filter.ts`, `src/common/dto/pagination.dto.ts` y `src/common/schema/timestamp.ts`.
7. **Database module:** crear `DATABASE_CONNECTION` symbol que provea `NodePgDatabase` antes de que los adapters lo consuman.

### Variante de setup: BD dentro de un contenedor Postgres compartido (no dedicado)

El escenario "estándar" del proyecto asume un `docker-compose.yml` con su propio `postgres:17-alpine` dedicado, puerto no estándar (ej: `5433:5432`), y una sola BD (ej: `apirestequipment`). En la práctica, **Pedro ya tiene un contenedor Postgres compartido corriendo** (ej: `pgn8n`) que sirve a varias apps (n8n, evolution-api, esta). No se debe crear otro `postgres` service propio; se debe apuntar la app a una BD nueva dentro del contenedor existente.

**Patrón verificado en sesión apirestequipment 2026-07-02:**

1. **Detectar el contenedor compartido** — `docker ps --filter name=<container>` o preguntar al usuario. No asumir que `localhost:5432` mapea al contenedor correcto; el puerto expuesto puede ser cualquiera.
2. **Crear la BD dentro del contenedor compartido** — el admin user (típicamente `winlinxenix`, no el de la app) es el único que puede crear BDs. Ejecutar:
   ```bash
   docker exec -it pgn8n psql -U winlinxenix -d n8n \
     -c "CREATE DATABASE equipment;"
   ```
3. **Decidir entre usuario dedicado y reusar el admin**:
   - **Recomendado:** usuario dedicado (`equipment_user`) con password nueva, `GRANT ALL ON DATABASE`, y `GRANT ALL ON SCHEMA public`. Least-privilege.
   - **Rápido pero riesgoso:** reusar `winlinxenix` con su password. La app queda con superusuario de Postgres.
4. **Apuntar el `DATABASE_URL` del `.env`** a `postgresql://<user>:<password>@localhost:<puerto>/equipment`. Si el contenedor no expone el puerto, agregarlo al `docker run` original o recrear con `-p 127.0.0.1:5432:5432`.
5. **Borrar el `docker-compose.yml` de la app o dejarlo como no-op** — si la app no tiene su propio postgres, el compose solo confunde. Borrarlo o reducirlo a un comment block explicando que la BD vive en el contenedor compartido.
6. **Limpiar `.env`** — quitar las variables del compose compartido (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_CONTAINER`, `POSTGRES_DB_N8N`, etc.) si estaban ahí. El `.env` de la app solo debe tener vars que la app consume (`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_*`, `PORT`, `NODE_ENV`).
7. **Aplicar el schema Drizzle**: `pnpm run db:push` (más rápido) o `pnpm run db:generate && pnpm run db:migrate` (versionado, recomendado para prod).
8. **Verificar**: `pnpm run build && pnpm run lint && pnpm run test` y arrancar el server.

**Pitfalls del setup compartido:**

- **El puerto del `DATABASE_URL` debe coincidir con el puerto que el contenedor expone al host.** En sesión 2026-07-02, `.env` tenía `localhost:5433` y el nuevo compose exponía `5432` → la app no se conectaba. Regla: el `DATABASE_URL` es la verdad; el compose (o el `docker run`) debe exponer exactamente ese puerto.
- **El admin user de Postgres (`winlinxenix`) no es lo mismo que el user de la app (`equipment_user`)**. Mezclarlos lleva a que la app corra con superusuario, o a errores de `permission denied for schema public` cuando el user nuevo no tiene grants. Verificar con `\dn` y `\du` dentro del contenedor.
- **El `docker-compose.yml` de la app hereda vars de `.env` con sintaxis `${VAR}`.** Si el compose define `POSTGRES_DB: ${POSTGRES_DB_N8N}` y la app espera una BD llamada `equipment`, hay que crear la BD correcta y/o cambiar la var. El compose no crea BDs adicionales por sí solo — solo la `POSTGRES_DB` inicial.
- **Si se quiere que el contenedor cree múltiples BDs al iniciar**, hace falta un script en `init-scripts/` (montado en `/docker-entrypoint-initdb.d`) que ejecute `CREATE DATABASE` por cada BD. **Pero** esto solo corre la primera vez que se inicializa el volumen. Si el contenedor ya está corriendo, hay que crear las BDs adicionales a mano con `docker exec psql` como en el paso 2.
- **El `restart: always` + `container_name` con var (`${POSTGRES_CONTAINER}`) es una bomba de tiempo** si se llega a cambiar el nombre de la var — el `docker-compose up` falla con "container name already in use" porque el contenedor viejo sigue ahí. Decidir el nombre en el `.env` y dejarlo estable.
- **Borrar el `docker-compose.yml` no rompe nada si el contenedor compartido sigue corriendo**, pero `.env` queda con vars zombies (`POSTGRES_USER`, etc.) que confunden. Mantener el `.env` de la app minimal: solo vars que la app lee en runtime.
- **Drizzle-kit pide confirmación interactiva en `db:push` cuando detecta drift.** En entorno no-TTY (agentes), usar `--force` o pipear `y` para evitar cuelgues. `db:generate` no es interactivo y es la opción segura para agentes.

**Verificación rápida del setup compartido:**

```bash
# 1. El contenedor está vivo
docker ps --filter name=pgn8n --format "{{.Names}} {{.Status}}"

# 2. La BD existe
docker exec pgn8n psql -U winlinxenix -d postgres -c "\l" | grep equipment

# 3. El user tiene acceso
docker exec -e PGPASSWORD=<password> pgn8n psql -U equipment_user -d equipment -c "SELECT 1;"

# 4. La app conecta
pnpm run start:dev  # o: node dist/src/main.js
curl -sS http://localhost:3000/api/<health-endpoint>
```

Si los cuatro pasos pasan, el setup compartido está bien. Si el paso 4 falla con "ECONNREFUSED", revisar el `DATABASE_URL` y el puerto expuesto.

**Cuándo NO usar este patrón:** si el contenedor compartido es de un tercero (no controlado por ti) o si las credenciales del admin user (`winlinxenix`) no deberían salir del `.env` de tu app, mejor levantar un `docker-compose.yml` dedicado. La fricción de pedir al usuario que ejecute `docker exec` es real (en este entorno el agente no tiene sudo a docker), y compartir el admin user es un anti-patrón de seguridad.

---

### Logger.log del puerto tras `app.listen()`

Para confirmar visualmente que el servidor arrancó en el puerto correcto (no quedarse esperando a que un `curl` falle), agregar tras `await app.listen(port)`:

```ts
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // ... pipes, filters, swagger ...

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`Server running at: ${port}`, 'Bootstrap');
}
```

El log aparece en consola con el formato estándar de NestJS:

```
[Nest] 12345  - 30/06/2026, 9:08:33 p.m.     LOG [Bootstrap] Server running at: 3000
```

Útil especialmente cuando el server se lanza vía `terminal(background=true)` y el wrapper bash no propaga stdout — `process(action="log")` lo captura.

## Verificación post-edición: build + lint + test, no solo build

`pnpm run build` solo verifica que TypeScript compila. **Después de cualquier edit de código**, correr la cadena completa:

```bash
pnpm run build && pnpm run lint && pnpm run test
```

El sistema de Hermes lo exigirá explícitamente con un mensaje como "Run the relevant verification command now" si solo verificas build. Es el patrón estándar y cubre:

- Errores de tipos que escapan a `tsc` strict (p. ej. regresiones por `import type` mal puesto).
- Reglas de lint (eslint) que detectan patrones prohibidos que TS no atrapa.
- Specs que rompiste con tu cambio.

`pnpm run test:cov` (con coverage) además revela qué código quedó sin cubrir tras el cambio.

## Verbo final

Cuando el usuario pida "crear un módulo X siguiendo el patrón de apirestcondom" o "aplicar arquitectura hexagonal a este backend", seguir este skill paso a paso. Si el cambio no es trivial, usar el skill `plan` primero para escribir un plan en `.hermes/plans/`.

## Plantillas actualizadas

Las plantillas en `templates/` están alineadas con los pitfalls de esta sección. Cuando copies un template para un nuevo módulo, recuerda:

- Usar `import type` para `IEntity` en el service.
- Usar `mapDatabaseError(error ?? undefined)` en el adapter.
- Declarar el DTO con propiedades no inicializadas (se asignan por `ValidationPipe`).
- Agregar `moduleNameMapper` si el proyecto usa paths `src/*` y Jest.

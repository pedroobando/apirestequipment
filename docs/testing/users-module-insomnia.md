# Plan de prueba — Módulo `users` con Insomnia

Guía paso a paso para levantar el servidor, crear **8 usuarios** desde fuera (Insomnia / curl) y ejercer todos los endpoints del módulo `users` end-to-end.

> **Convención del repo:** documentación en español. Comandos, payloads y comentarios de los requests en español; los nombres de campos del JSON van en inglés porque así están definidos en los DTOs.

---

## ⓘ Atajo: script automatizado

Si no querés tipear los 8 POSTs + 2 PATCHes a mano, hay un script que automatiza **toda la sección 4 + 5** de este doc. Sigue ejercitando la API real (login admin → POST /users → PATCH /users/:id) y al final te imprime una tabla con los IDs que necesitás para los pasos siguientes.

```bash
# 1. Server arriba en :3000
pnpm start:dev

# 2. Crear los 8 usuarios + promover 2 a admin
pnpm db:testing:users

# 3. (Opcional) Borrar todo al final
pnpm db:testing:users:cleanup
```

El script es idempotente: si un usuario ya existe (409), lo skipea y reusa su ID. Por eso es seguro re-ejecutarlo.

Overrides de environment si tu admin no es el del seed por defecto:

```bash
BASE_URL=http://localhost:3000/api \
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD=password123 \
pnpm db:testing:users
```

> Las secciones 1-3 (setup), 6 (lectura), 7 (actualización), 8 (borrado), 9 (errores) y 11 (checklist) **siguen aplicando tal cual** — el script solo reemplaza la creación manual de las secciones 4 y 5.

---

## 0. Prerrequisitos

| # | Requisito | Verificación |
|---|-----------|--------------|
| 1 | Stack local arriba (Postgres + MinIO + pgAdmin) | `docker compose ps` → todos `healthy` |
| 2 | Migraciones aplicadas y seed ejecutado | `pnpm seed:dev` (revisa el script en `package.json`) |
| 3 | API corriendo en `:3000` | `curl http://localhost:3000/api/docs-json \| head` |
| 4 | Insomnia instalado (o `curl` como fallback) | — |

El seed (`src/database/seeds/seed-dev.ts`) deja **2 admins y 2 users** ya creados. Vamos a usar uno de los admins como "admin de arranque" para crear los 8 nuevos.

---

## 1. Configuración de Insomnia

### 1.1 Crear un environment

Menú **No Environment → Manage Environments → +**:

| Variable    | Valor                          |
|-------------|--------------------------------|
| `baseUrl`   | `http://localhost:3000/api`    |
| `adminEmail`| `admin@gmail.com`              |
| `adminPass` | `c27174055#`                   |

> Cambiá `adminEmail` / `adminPass` por `admin@example.com` / `password123` si preferís usar el otro admin del seed.

### 1.2 Carpeta de requests

Crear una colección `Users — pruebas` con subcarpetas:

```
Users — pruebas/
├─ 0 · Auth/
│   └─ Login admin
├─ 1 · Crear (8 usuarios)/
│   └─ Create user × 8
├─ 2 · Promover a admin/
│   └─ PATCH promote × 2
├─ 3 · Lectura/
│   ├─ GET /users (paginated)
│   ├─ GET /users/me
│   └─ GET /users/:id
├─ 4 · Actualización/
│   ├─ PATCH /users/me
│   └─ PATCH /users/:id
└─ 5 · Borrado/
    └─ DELETE /users/:id
```

### 1.3 Auth Bearer por carpeta

Sobre la carpeta raíz: clic derecho → **Environment → Auth → Bearer Token**. En el campo *Token* pegá `{{ _.accessToken }}` (se setea en el paso 2.2).

---

## 2. Autenticación: login como admin

### 2.1 Request

| Campo      | Valor                                      |
|------------|--------------------------------------------|
| Método     | `POST`                                     |
| URL        | `{{ baseUrl }}/auth/login`                 |
| Body       | `JSON`                                     |

```json
{
  "email": "{{ adminEmail }}",
  "password": "{{ adminPass }}"
}
```

### 2.2 Capturar el token

En la pestaña **Tests** del request:

```js
const body = insomnia.response.json();
if (body && body.accessToken) {
  insomnia.environment.set('accessToken', body.accessToken);
  insomnia.environment.set('refreshToken', body.refreshToken);
}
```

Después de ejecutarlo una vez, `{{ accessToken }}` queda disponible para todos los requests autenticados.

### 2.3 Respuesta esperada — `200 OK`

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "user": {
    "id": "uuid-admin",
    "email": "admin@gmail.com",
    "role": "admin",
    ...
  }
}
```

### 2.4 Equivalente curl

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"c27174055#"}'
```

---

## 3. Los 8 usuarios a crear

Todos empiezan como `role: "user"` (el DTO `CreateUserDto` no acepta `role`). Después promovemos 2 a `admin` con `PATCH /users/:id` para probar el endpoint admin de update.

**Password común para todos los de prueba:** `Test1234` (cumple `MinLength(8)`).

| #  | Email                              | Nombre        | Apellido      | Teléfono         | Rol final | Notas                       |
|----|------------------------------------|---------------|---------------|------------------|-----------|-----------------------------|
| 1  | `admin.ops@apirestequip.com`       | Pedro         | Medina        | `+584141111111`  | `admin`   | Promovido en paso 4.1       |
| 2  | `admin.support@apirestequip.com`   | Lucía         | Torres        | `+584142222222`  | `admin`   | Promovido en paso 4.1       |
| 3  | `operator1@apirestequip.com`       | Carlos        | Pérez         | `+584143333333`  | `user`    | Phone presente              |
| 4  | `operator2@apirestequip.com`       | María         | García        | `+584144444444`  | `user`    | Phone presente              |
| 5  | `operator3@apirestequip.com`       | Luis          | Rodríguez     | _(omitido)_      | `user`    | Phone ausente (opcional)    |
| 6  | `operator4@apirestequip.com`       | Ana           | Martínez      | `+584145555555`  | `user`    | Phone presente              |
| 7  | `operator5@apirestequip.com`       | José          | Hernández     | _(omitido)_      | `user`    | Phone ausente (opcional)    |
| 8  | `operator6@apirestequip.com`       | Sofía         | Castillo      | `+584146666666`  | `user`    | Phone presente              |

Guardá los **IDs** que devuelve cada `POST` — los vas a necesitar para los GET/PATCH/DELETE siguientes. En Insomnia podés capturarlos en **Tests** con:

```js
const body = insomnia.response.json();
if (body && body.id) {
  insomnia.environment.set('user_' + {{ _.idx }} + '_id', body.id);
}
```

> Más simple: armá un array mental (o esta tabla) y reemplazá `<id>` en los ejemplos por el UUID real.

---

## 4. Crear los 8 usuarios

### 4.1 Request genérico

| Campo | Valor                                  |
|-------|----------------------------------------|
| Método| `POST`                                 |
| URL   | `{{ baseUrl }}/users`                 |
| Auth  | Bearer `{{ accessToken }}` (admin)     |
| Body  | `JSON`                                 |

### 4.2 Payload por usuario

#### Usuario 1 — `admin.ops` (luego promovido a admin)

```json
{
  "email": "admin.ops@apirestequip.com",
  "password": "Test1234",
  "firstName": "Pedro",
  "lastName": "Medina",
  "phone": "+584141111111"
}
```

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email":"admin.ops@apirestequip.com",
    "password":"Test1234",
    "firstName":"Pedro",
    "lastName":"Medina",
    "phone":"+584141111111"
  }'
```

#### Usuario 2 — `admin.support` (luego promovido a admin)

```json
{
  "email": "admin.support@apirestequip.com",
  "password": "Test1234",
  "firstName": "Lucía",
  "lastName": "Torres",
  "phone": "+584142222222"
}
```

#### Usuario 3 — `operator1`

```json
{
  "email": "operator1@apirestequip.com",
  "password": "Test1234",
  "firstName": "Carlos",
  "lastName": "Pérez",
  "phone": "+584143333333"
}
```

#### Usuario 4 — `operator2`

```json
{
  "email": "operator2@apirestequip.com",
  "password": "Test1234",
  "firstName": "María",
  "lastName": "García",
  "phone": "+584144444444"
}
```

#### Usuario 5 — `operator3` (sin phone)

```json
{
  "email": "operator3@apirestequip.com",
  "password": "Test1234",
  "firstName": "Luis",
  "lastName": "Rodríguez"
}
```

#### Usuario 6 — `operator4`

```json
{
  "email": "operator4@apirestequip.com",
  "password": "Test1234",
  "firstName": "Ana",
  "lastName": "Martínez",
  "phone": "+584145555555"
}
```

#### Usuario 7 — `operator5` (sin phone)

```json
{
  "email": "operator5@apirestequip.com",
  "password": "Test1234",
  "firstName": "José",
  "lastName": "Hernández"
}
```

#### Usuario 8 — `operator6`

```json
{
  "email": "operator6@apirestequip.com",
  "password": "Test1234",
  "firstName": "Sofía",
  "lastName": "Castillo",
  "phone": "+584146666666"
}
```

### 4.3 Respuesta esperada — `201 Created`

```json
{
  "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "email": "operator1@apirestequip.com",
  "firstName": "Carlos",
  "lastName": "Pérez",
  "phone": "+584143333333",
  "role": "user",
  "provider": "local",
  "isActive": true,
  "createdAt": "2026-07-06T...",
  "updatedAt": "2026-07-06T..."
}
```

⚠️ **Guardar el `id` de cada uno** — los siguientes pasos lo necesitan.

---

## 5. Promover a admin (PATCH /users/:id)

Necesario porque `POST /users` no permite setear `role`. Con el token del admin de arranque:

| Campo | Valor                              |
|-------|------------------------------------|
| Método| `PATCH`                            |
| URL   | `{{ baseUrl }}/users/<id>`        |
| Auth  | Bearer `{{ accessToken }}`         |

Body para `admin.ops` y `admin.support`:

```json
{
  "role": "admin",
  "isActive": true
}
```

```bash
curl -X PATCH http://localhost:3000/api/users/<id-admin-ops> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"role":"admin","isActive":true}'
```

> Repetí para `<id-admin-support>`. **Orden importa en el controller** — `PATCH /users/:id` está después de `PATCH /users/me`, así que no hay colisión de rutas con esos IDs.

---

## 6. Probar los endpoints de lectura

### 6.1 `GET /users` — listar paginado (admin)

| Campo | Valor                              |
|-------|------------------------------------|
| Método| `GET`                              |
| URL   | `{{ baseUrl }}/users?page=1&limit=20` |
| Auth  | Bearer `{{ accessToken }}`         |

```bash
curl "http://localhost:3000/api/users?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado:** `200` con `data[]` (los 4 del seed + los 8 que acabás de crear = 12), más meta `{ page, limit, total, totalPages }`.

### 6.2 `GET /users/me` — perfil propio (cualquier user logueado)

Para no usar siempre el admin, logueate como `operator1` (paso 7.1) y luego:

```bash
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN_OPERATOR1"
```

### 6.3 `GET /users/:id` — buscar por id (cualquier user autenticado)

```bash
curl http://localhost:3000/api/users/<id-operator3> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 7. Probar los endpoints de actualización

### 7.1 (Setup) Login como `operator1` para testear `PATCH /me`

Request `POST /auth/login` con:

```json
{ "email": "operator1@apirestequip.com", "password": "Test1234" }
```

Guardá el `accessToken` en una variable separada, p. ej. `operator1Token`.

### 7.2 `PATCH /users/me` — auto-edición (sin role ni isActive)

| Campo | Valor                              |
|-------|------------------------------------|
| Método| `PATCH`                            |
| URL   | `{{ baseUrl }}/users/me`           |
| Auth  | Bearer `{{ operator1Token }}`      |

```json
{
  "firstName": "Carlos Andrés",
  "phone": "+584149999999"
}
```

```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPERATOR1_TOKEN" \
  -d '{"firstName":"Carlos Andrés","phone":"+584149999999"}'
```

**Verificar:** el `role` y `isActive` no se tocan aunque los mandes (el DTO `UpdateMeDto` no los incluye).

### 7.3 `PATCH /users/:id` — edición admin

Volvé al `accessToken` del admin y editá, por ejemplo, `operator5` (desactivar):

```json
{ "isActive": false, "phone": "+584147777777" }
```

```bash
curl -X PATCH http://localhost:3000/api/users/<id-operator5> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"isActive":false,"phone":"+584147777777"}'
```

---

## 8. Probar el borrado

### 8.1 `DELETE /users/:id` — solo admin

```bash
curl -X DELETE http://localhost:3000/api/users/<id-operator8> \
  -H "Authorization: Bearer $TOKEN"
```

**Esperado:** `200` (o `204`) con el user eliminado. Verificá con un `GET /users/:id` posterior → debe dar `404 Not Found`.

---

## 9. Matriz de pruebas de error

Pruebas recomendadas para validar los guards y la validación:

| # | Caso                                                | Endpoint                | Resultado esperado |
|---|-----------------------------------------------------|-------------------------|--------------------|
| 1 | Crear user sin token                                | `POST /users`           | `401 Unauthorized` |
| 2 | Crear user con token de operator1 (no admin)        | `POST /users`           | `403 Forbidden`    |
| 3 | Crear user con email duplicado                      | `POST /users`           | `409 Conflict`     |
| 4 | Crear user con password de 5 chars                  | `POST /users`           | `400 Bad Request` (validation) |
| 5 | `GET /users/abc` (id no UUID)                       | `GET /users/:id`        | `400 Bad Request` (ParseUUIDPipe) |
| 6 | `GET /users/<uuid-inexistente>`                     | `GET /users/:id`        | `404 Not Found`    |
| 7 | `PATCH /users/me` con `role: "admin"`               | `PATCH /users/me`       | `400 Bad Request` (whitelist rechaza `role`) |
| 8 | Login con password incorrecto                       | `POST /auth/login`      | `401 Unauthorized` |

> El `ValidationPipe` global usa `whitelist: true` y `forbidNonWhitelisted: true`, por eso el caso 7 rebota. El `GlobalExceptionFilter` envuelve la respuesta con un `errorId` UUID que podés cruzar con los logs del servidor.

---

## 10. Cleanup (opcional)

Al terminar, podés borrar los 6 operators que creaste para dejar la base limpia. Cuidado: **no borres el admin de arranque** o perdés acceso al módulo.

```bash
for id in <id-1> <id-2> <id-3> <id-4> <id-5> <id-6>; do
  curl -X DELETE "http://localhost:3000/api/users/$id" \
    -H "Authorization: Bearer $TOKEN"
done
```

O usá `pnpm seed:dev` para volver al estado inicial.

---

## 11. Checklist final

- [ ] Login admin OK
- [ ] 8 usuarios creados (IDs guardados)
- [ ] 2 promovidos a `admin` (verificar con `GET /users`)
- [ ] `GET /users?page=1&limit=20` devuelve 12 (4 seed + 8)
- [ ] `PATCH /users/me` con operator1 funciona y no toca role
- [ ] `DELETE /users/:id` borra y el `GET` siguiente da 404
- [ ] Matriz de errores del paso 9 pasada
- [ ] Logs del servidor con `errorId` correlacionados con respuestas 4xx/5xx

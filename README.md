# API REST Equipment

Backend para registro y seguimiento de equipos durante emergencias en Venezuela.

## Stack

- NestJS 11
- Drizzle ORM
- PostgreSQL 17
- pnpm

## Arquitectura

Hexagonal con separacion por modulos:

```
src/<modulo>/
  schema/           # Drizzle schema
  interfaces/       # Tipos
  dto/              # Data transfer objects
  ports/            # Repositorios (Symbol tokens)
  adapters/         # Implementacion Drizzle
  <modulo>.service.ts
  <modulo>.controller.ts
  <modulo>.module.ts
```

## Requisitos

- Node.js 20+
- pnpm
- Docker / Docker Compose (usuario en grupo docker o sudo)

## Configuracion

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Ajustar `.env` con tus credenciales.

## Base de datos

```bash
# Iniciar PostgreSQL (requiere sudo si no estas en grupo docker)
sudo docker compose up -d

# Generar migraciones
pnpm run db:generate

# Aplicar migraciones
pnpm run db:migrate

# Seed de tipos de equipo
pnpm run db:seed

# Studio visual de Drizzle
pnpm run db:studio
```

## Instalacion

```bash
pnpm install
```

## Ejecucion

```bash
# Desarrollo
pnpm run start:dev

# Produccion
pnpm run build
pnpm run start:prod
```

La API expone Swagger en `/api/docs`.

## Pruebas

```bash
# Unitarios
pnpm run test

# Cobertura
pnpm run test:cov

# E2E
pnpm run test:e2e
```

## Convenciones

- Codigo en ingles.
- README y mensajes de commit en espanol.
- Commits con Conventional Commits.
- Cobertura minima del 60%.

## Autor

Pedro Obando.

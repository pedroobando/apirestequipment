/**
 * Automated seeding of test equipment data via the public HTTP API.
 *
 * Creates 5 users, 5 operators, 5 equipment types and a random number
 * (7-12) of equipment items per type. Keeps track of created ids in
 * scripts/.seeded-equipment-state.json so cleanup-testing-equipment.ts
 * can delete everything afterwards.
 *
 * Environment overrides:
 *   BASE_URL        (default: http://localhost:3000/api)
 *   ADMIN_EMAIL     (default: admin@gmail.com)
 *   ADMIN_PASSWORD  (default: c27174055#)
 *
 * Usage:
 *   pnpm db:testing:equipment
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@gmail.com';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'c27174055#';
const TEST_PASSWORD = 'Test1234';
const STATE_FILE = path.join(__dirname, '.seeded-equipment-state.json');

const EQUIPMENT_TYPE_NAMES = [
  'Ambulancia',
  'Camioneta',
  'Camion de carga',
  'Camion de bomberos',
  'Planta electrica',
];

const BRANDS = ['Toyota', 'Ford', 'Chevrolet', 'Iveco', 'Mercedes'];
const MODELS = ['Hilux', 'F-150', 'Silverado', 'Daily', 'Sprinter'];
const FUEL_TYPES = ['gasoline', 'diesel', 'electric'];
const CAPACITIES = ['1 ton', '2 ton', '5 ton', '10 ton'];

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

interface PaginatedUsers {
  data: UserResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EquipmentTypeResponse {
  id: string;
  name: string;
  isActive: boolean;
}

interface OperatorResponse {
  id: string;
  userId: string;
  licenseNumber: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
}

interface PaginatedOperators {
  data: OperatorResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EquipmentResponse {
  id: string;
  ownerId: string;
  operatorId: string | null;
  equipmentTypeId: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  serialNumber: string | null;
  fuelType: string | null;
  capacity: string | null;
  status: string;
  isActive: boolean;
}

interface PaginatedEquipment {
  data: EquipmentResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiErrorBody {
  message?: string;
  statusCode?: number;
  errorId?: string;
}

interface SeedState {
  users: { createdIds: string[]; reusedIds: string[] };
  operators: { createdIds: string[]; reusedIds: string[] };
  equipmentTypes: { createdIds: string[]; reusedIds: string[] };
  equipment: { createdIds: string[]; reusedIds: string[] };
}

interface CreateOperatorPayload {
  userId: string;
  licenseNumber?: string;
  phone?: string;
  role?: string;
}

interface CreateEquipmentPayload {
  ownerId: string;
  operatorId?: string;
  equipmentTypeId: string;
  brand?: string;
  model?: string;
  year?: number;
  plate?: string;
  serialNumber?: string;
  fuelType?: string;
  capacity?: string;
}

class ApiCallError extends Error {
  constructor(
    public readonly method: string,
    public readonly path: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly serverMessage?: string,
    public readonly serverErrorId?: string,
  ) {
    super(
      `${method} ${path} → ${status} ${statusText}` +
      (serverMessage ? ` — ${serverMessage}` : '') +
      (serverErrorId ? ` [errorId: ${serverErrorId}]` : ''),
    );
  }
}

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errBody: ApiErrorBody | null = null;
    try { errBody = (await res.json()) as ApiErrorBody; } catch { /* not json */ }
    throw new ApiCallError(
      method,
      path,
      res.status,
      res.statusText,
      errBody?.message,
      errBody?.errorId,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function login(): Promise<string> {
  console.log(`\n→ Login admin: ${ADMIN_EMAIL}`);
  const res = await api<{ accessToken: string }>(
    'POST',
    '/auth/login',
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  );
  console.log('  ✓ accessToken obtenido');
  return res.accessToken;
}

async function createUser(
  token: string,
  user: SeedUser,
): Promise<{ id: string; created: boolean }> {
  const payload = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    password: user.password,
  };

  try {
    const res = await api<UserResponse>('POST', '/users', payload, token);
    console.log(`  ✓ POST /users  ${user.email.padEnd(42)} → ${res.id}`);
    return { id: res.id, created: true };
  } catch (err) {
    if (err instanceof ApiCallError && err.status === 409) {
      const list = await api<PaginatedUsers>('GET', '/users?page=1&limit=100', undefined, token);
      const found = list.data.find((u) => u.email === user.email);
      if (!found) {
        throw new Error(`409 recibido pero ${user.email} no aparece en GET /users`);
      }
      console.log(`  ↻ ${user.email.padEnd(42)} ya existe (id: ${found.id})`);
      return { id: found.id, created: false };
    }
    throw err;
  }
}

async function createEquipmentType(
  token: string,
  name: string,
): Promise<{ id: string; created: boolean }> {
  try {
    const res = await api<EquipmentTypeResponse>('POST', '/equipment-types', { name }, token);
    console.log(`  ✓ POST /equipment-types  ${name.padEnd(20)} → ${res.id}`);
    return { id: res.id, created: true };
  } catch (err) {
    if (err instanceof ApiCallError && err.status === 409) {
      const list = await api<EquipmentTypeResponse[]>('GET', '/equipment-types', undefined, token);
      const found = list.find((t) => t.name === name);
      if (!found) {
        throw new Error(`409 recibido pero el tipo "${name}" no aparece en GET /equipment-types`);
      }
      console.log(`  ↻ ${name.padEnd(20)} ya existe (id: ${found.id})`);
      return { id: found.id, created: false };
    }
    throw err;
  }
}

async function createOperator(
  token: string,
  dto: CreateOperatorPayload,
  userEmail: string,
): Promise<{ id: string; created: boolean }> {
  try {
    const res = await api<OperatorResponse>('POST', '/operators', dto, token);
    console.log(
      `  ✓ POST /operators  ${dto.licenseNumber?.padEnd(12)} (user ${userEmail}) → ${res.id}`,
    );
    return { id: res.id, created: true };
  } catch (err) {
    if (err instanceof ApiCallError && err.status === 409) {
      const list = await api<PaginatedOperators>('GET', '/operators?page=1&limit=100', undefined, token);
      const found = list.data.find((o) => o.userId === dto.userId);
      if (!found) {
        throw new Error(`409 recibido pero no hay operador para userId ${dto.userId} en GET /operators`);
      }
      console.log(`  ↻ operator for ${userEmail} already exists (id: ${found.id})`);
      return { id: found.id, created: false };
    }
    throw err;
  }
}

async function createEquipmentItem(
  token: string,
  dto: CreateEquipmentPayload,
): Promise<{ id: string; created: boolean }> {
  try {
    const res = await api<EquipmentResponse>('POST', '/equipment', dto, token);
    console.log(`  ✓ POST /equipment  ${dto.plate?.padEnd(12)} → ${res.id}`);
    return { id: res.id, created: true };
  } catch (err) {
    if (err instanceof ApiCallError && err.status === 409) {
      const list = await api<PaginatedEquipment>('GET', '/equipment?page=1&limit=100', undefined, token);
      const found = list.data.find((e) => e.plate === dto.plate);
      if (!found) {
        throw new Error(`409 recibido pero la placa "${dto.plate}" no aparece en GET /equipment`);
      }
      console.log(`  ↻ equipment ${dto.plate?.padEnd(12)} already exists (id: ${found.id})`);
      return { id: found.id, created: false };
    }
    throw err;
  }
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function buildUsers(): SeedUser[] {
  return Array.from({ length: 5 }, (_, i) => {
    const n = i + 1;
    return {
      email: `seed.equip.user${n}@apirestequip.com`,
      firstName: 'Operario',
      lastName: `Eq ${n}`,
      password: TEST_PASSWORD,
    };
  });
}

function printSummary(
  users: { created: number; reused: number },
  operators: { created: number; reused: number },
  equipmentTypes: { created: number; reused: number },
  equipment: { created: number; reused: number },
): void {
  const labelW = 20;
  const createdW = 8;
  const reusedW = 9;
  const sep = '─'.repeat(labelW + createdW + reusedW + 5);

  console.log('\n' + sep);
  console.log(
    `${'Resumen'.padEnd(labelW)}  ${'Creados'.padStart(createdW)}  ${'Reusados'.padStart(reusedW)}`,
  );
  console.log(sep);
  console.log(
    `${'Usuarios'.padEnd(labelW)}  ${String(users.created).padStart(createdW)}  ${String(users.reused).padStart(reusedW)}`,
  );
  console.log(
    `${'Operarios'.padEnd(labelW)}  ${String(operators.created).padStart(createdW)}  ${String(operators.reused).padStart(reusedW)}`,
  );
  console.log(
    `${'Tipos de equipo'.padEnd(labelW)}  ${String(equipmentTypes.created).padStart(createdW)}  ${String(equipmentTypes.reused).padStart(reusedW)}`,
  );
  console.log(
    `${'Equipos'.padEnd(labelW)}  ${String(equipment.created).padStart(createdW)}  ${String(equipment.reused).padStart(reusedW)}`,
  );
  console.log(sep);
}

async function main(): Promise<void> {
  console.log('=== Seeding de equipos de prueba vía HTTP ===');
  console.log(`    baseUrl: ${BASE_URL}`);

  try {
    await fs.access(STATE_FILE);
    console.error(`\n⚠️  El archivo de estado ya existe: ${STATE_FILE}`);
    console.error('   Ejecutá primero pnpm db:testing:equipment:cleanup');
    console.error('   O borrá el archivo manualmente si estás seguro.');
    process.exit(1);
  } catch {
    /* no existe, continuamos */
  }

  const token = await login();

  console.log('\n→ Creando 5 usuarios (POST /users)…');
  const seedUsers = buildUsers();
  const userResults: { id: string; created: boolean; email: string }[] = [];
  for (const user of seedUsers) {
    const r = await createUser(token, user);
    userResults.push({ ...r, email: user.email });
  }

  console.log('\n→ Creando 5 operarios (POST /operators)…');
  const operatorResults: { id: string; created: boolean }[] = [];
  for (let i = 0; i < 5; i++) {
    const n = i + 1;
    const user = userResults[i]!;
    const r = await createOperator(token, {
      userId: user.id,
      licenseNumber: `LIC-EQ-${String(n).padStart(3, '0')}`,
      phone: `+5841400000${n}`,
      role: 'driver',
    }, user.email);
    operatorResults.push(r);
  }

  console.log('\n→ Creando 5 tipos de equipo (POST /equipment-types)…');
  const equipmentTypeResults: { id: string; created: boolean }[] = [];
  for (const name of EQUIPMENT_TYPE_NAMES) {
    const r = await createEquipmentType(token, name);
    equipmentTypeResults.push(r);
  }

  console.log('\n→ Creando equipos (POST /equipment)…');
  const equipmentResults: { id: string; created: boolean }[] = [];
  for (let typeIndex = 0; typeIndex < equipmentTypeResults.length; typeIndex++) {
    const equipmentTypeId = equipmentTypeResults[typeIndex]!.id;
    const count = randInt(7, 12);
    console.log(`  Tipo ${EQUIPMENT_TYPE_NAMES[typeIndex]}: ${count} equipos`);
    for (let seq = 1; seq <= count; seq++) {
      const operatorId = Math.random() < 0.3 ? null : pick(operatorResults).id;
      const r = await createEquipmentItem(token, {
        ownerId: pick(userResults).id,
        operatorId: operatorId ?? undefined,
        equipmentTypeId,
        brand: pick(BRANDS),
        model: pick(MODELS),
        year: randInt(2018, 2026),
        plate: `SEED-${typeIndex}-${String(seq).padStart(2, '0')}`,
        serialNumber: `SN-SEED-${typeIndex}-${String(seq).padStart(2, '0')}`,
        fuelType: pick(FUEL_TYPES),
        capacity: pick(CAPACITIES),
      });
      equipmentResults.push(r);
    }
  }

  const createdOperatorIds = operatorResults.filter((r) => r.created).map((r) => r.id);
  const reusedOperatorIds = operatorResults.filter((r) => !r.created).map((r) => r.id);
  const createdEquipmentTypeIds = equipmentTypeResults.filter((r) => r.created).map((r) => r.id);
  const reusedEquipmentTypeIds = equipmentTypeResults.filter((r) => !r.created).map((r) => r.id);
  const createdEquipmentIds = equipmentResults.filter((r) => r.created).map((r) => r.id);
  const reusedEquipmentIds = equipmentResults.filter((r) => !r.created).map((r) => r.id);

  const state: SeedState = {
    users: {
      createdIds: userResults.filter((r) => r.created).map((r) => r.id),
      reusedIds: userResults.filter((r) => !r.created).map((r) => r.id),
    },
    operators: {
      createdIds: createdOperatorIds,
      reusedIds: reusedOperatorIds,
    },
    equipmentTypes: {
      createdIds: createdEquipmentTypeIds,
      reusedIds: reusedEquipmentTypeIds,
    },
    equipment: {
      createdIds: createdEquipmentIds,
      reusedIds: reusedEquipmentIds,
    },
  };

  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2) + '\n', 'utf-8');
  console.log(`\n→ Estado guardado en ${STATE_FILE}`);

  printSummary(
    {
      created: state.users.createdIds.length,
      reused: state.users.reusedIds.length,
    },
    {
      created: state.operators.createdIds.length,
      reused: state.operators.reusedIds.length,
    },
    {
      created: state.equipmentTypes.createdIds.length,
      reused: state.equipmentTypes.reusedIds.length,
    },
    {
      created: state.equipment.createdIds.length,
      reused: state.equipment.reusedIds.length,
    },
  );

  console.log('\n✓ Listo. Para borrar todo: pnpm db:testing:equipment:cleanup');
}

main().catch((err: unknown) => {
  console.error('\n✗ FAILED:', err instanceof Error ? err.message : String(err));
  if (err instanceof ApiCallError && err.serverErrorId) {
    console.error(`  Server errorId: ${err.serverErrorId} (cross-reference with server logs)`);
  }
  process.exit(1);
});

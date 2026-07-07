/**
 * Cleanup script: deletes the test equipment data created by
 * seed-testing-equipment.ts using the ids stored in
 * scripts/.seeded-equipment-state.json.
 *
 * Environment overrides:
 *   BASE_URL        (default: http://localhost:3000/api)
 *   ADMIN_EMAIL     (default: admin@gmail.com)
 *   ADMIN_PASSWORD  (default: c27174055#)
 *
 * Usage:
 *   pnpm db:testing:equipment:cleanup
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@gmail.com';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'c27174055#';
const STATE_FILE = path.join(__dirname, '.seeded-equipment-state.json');

interface SeedState {
  users: { createdIds: string[]; reusedIds: string[] };
  operators: { createdIds: string[]; reusedIds: string[] };
  equipmentTypes: { createdIds: string[]; reusedIds: string[] };
  equipment: { createdIds: string[]; reusedIds: string[] };
}

interface ApiErrorBody {
  message?: string;
  statusCode?: number;
  errorId?: string;
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

async function deleteResource(
  token: string,
  resourcePath: string,
  id: string,
): Promise<{ ok: boolean; skipped: boolean }> {
  try {
    await api('DELETE', `${resourcePath}/${id}`, undefined, token);
    return { ok: true, skipped: false };
  } catch (err) {
    if (err instanceof ApiCallError && err.status === 404) {
      return { ok: true, skipped: true };
    }
    throw err;
  }
}

async function deleteBatch(
  token: string,
  label: string,
  resourcePath: string,
  ids: string[],
): Promise<{ ok: number; failed: number; skipped: number }> {
  if (ids.length === 0) {
    console.log(`\n→ ${label}: nada que borrar.`);
    return { ok: 0, failed: 0, skipped: 0 };
  }

  console.log(`\n→ Borrando ${ids.length} ${label.toLowerCase()}…`);
  let ok = 0;
  let failed = 0;
  let skipped = 0;

  for (const id of ids) {
    try {
      const res = await deleteResource(token, resourcePath, id);
      if (res.skipped) {
        console.log(`  ↻ ${id} ya no existe`);
        skipped++;
      } else {
        console.log(`  ✓ ${id}`);
        ok++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${id} — ${msg}`);
      failed++;
    }
  }

  return { ok, failed, skipped };
}

async function main(): Promise<void> {
  console.log('=== Cleanup: borrando equipos de prueba ===');
  console.log(`    baseUrl: ${BASE_URL}`);

  let state: SeedState;
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf-8');
    state = JSON.parse(raw) as SeedState;
  } catch {
    console.error(`\n✗ No se encontró ${STATE_FILE}`);
    console.error('   No hay nada para limpiar (o el archivo fue borrado).');
    process.exit(1);
  }

  const token = await login();

  const equipmentRes = await deleteBatch(token, 'Equipos', '/equipment', state.equipment.createdIds);
  const operatorRes = await deleteBatch(token, 'Operarios', '/operators', state.operators.createdIds);
  const userRes = await deleteBatch(token, 'Usuarios', '/users', state.users.createdIds);
  const typeRes = await deleteBatch(token, 'Tipos de equipo', '/equipment-types', state.equipmentTypes.createdIds);

  const allOk =
    equipmentRes.failed === 0 &&
    operatorRes.failed === 0 &&
    userRes.failed === 0 &&
    typeRes.failed === 0;

  if (allOk) {
    await fs.unlink(STATE_FILE);
    console.log(`\n→ Archivo de estado eliminado: ${STATE_FILE}`);
  } else {
    console.log(`\n⚠️  Hubo errores; se conserva ${STATE_FILE} para reintentar.`);
  }

  console.log('\nResumen:');
  console.log(`  Equipos      → ${equipmentRes.ok} borrados, ${equipmentRes.skipped} ya faltaban, ${equipmentRes.failed} fallidos`);
  console.log(`  Operarios    → ${operatorRes.ok} borrados, ${operatorRes.skipped} ya faltaban, ${operatorRes.failed} fallidos`);
  console.log(`  Usuarios     → ${userRes.ok} borrados, ${userRes.skipped} ya faltaban, ${userRes.failed} fallidos`);
  console.log(`  Tipos equipo → ${typeRes.ok} borrados, ${typeRes.skipped} ya faltaban, ${typeRes.failed} fallidos`);

  if (!allOk) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('\n✗ FAILED:', err instanceof Error ? err.message : String(err));
  if (err instanceof ApiCallError && err.serverErrorId) {
    console.error(`  Server errorId: ${err.serverErrorId} (cross-reference with server logs)`);
  }
  process.exit(1);
});

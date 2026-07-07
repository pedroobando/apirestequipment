/**
 * Automated seeding of 8 test users via the public HTTP API.
 *
 * Mirrors the manual flow described in docs/testing/users-module-insomnia.md
 * (sections 4 + 5). Requires the server to be running on $BASE_URL.
 *
 * Environment overrides:
 *   BASE_URL        (default: http://localhost:3000/api)
 *   ADMIN_EMAIL     (default: admin@gmail.com)
 *   ADMIN_PASSWORD  (default: c27174055#)
 *
 * Usage:
 *   pnpm db:testing:users
 */

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@gmail.com';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'c27174055#';
const TEST_PASSWORD = 'Test1234';

interface SeedUser {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  finalRole: 'admin' | 'user';
}

const USERS: SeedUser[] = [
  { email: 'admin.ops@apirestequip.com',     firstName: 'Pedro',  lastName: 'Medina',     phone: '+584141111111', finalRole: 'admin' },
  { email: 'admin.support@apirestequip.com', firstName: 'Lucía',  lastName: 'Torres',     phone: '+584142222222', finalRole: 'admin' },
  { email: 'operator1@apirestequip.com',     firstName: 'Carlos', lastName: 'Pérez',      phone: '+584143333333', finalRole: 'user'  },
  { email: 'operator2@apirestequip.com',     firstName: 'María',  lastName: 'García',     phone: '+584144444444', finalRole: 'user'  },
  { email: 'operator3@apirestequip.com',     firstName: 'Luis',   lastName: 'Rodríguez',                       finalRole: 'user'  },
  { email: 'operator4@apirestequip.com',     firstName: 'Ana',    lastName: 'Martínez',   phone: '+584145555555', finalRole: 'user'  },
  { email: 'operator5@apirestequip.com',     firstName: 'José',   lastName: 'Hernández',                       finalRole: 'user'  },
  { email: 'operator6@apirestequip.com',     firstName: 'Sofía',  lastName: 'Castillo',   phone: '+584146666666', finalRole: 'user'  },
];

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
  console.log('  ✓ accessToken obtained');
  return res.accessToken;
}

async function createUser(
  token: string,
  user: SeedUser,
): Promise<{ id: string; created: boolean }> {
  const { finalRole: _finalRole, ...userData } = user;
  const payload = { ...userData, password: TEST_PASSWORD };

  try {
    const res = await api<UserResponse>('POST', '/users', payload, token);
    console.log(`  ✓ POST /users  ${user.email.padEnd(36)} → ${res.id}`);
    return { id: res.id, created: true };
  } catch (err) {
    if (err instanceof ApiCallError && err.status === 409) {
      // Already exists — look up the id via GET /users
      const list = await api<PaginatedUsers>('GET', '/users?page=1&limit=100', undefined, token);
      const found = list.data.find((u) => u.email === user.email);
      if (!found) {
        throw new Error(`409 received but ${user.email} not found in /users listing`);
      }
      console.log(`  ↻ ${user.email.padEnd(36)} ya existe (id: ${found.id})`);
      return { id: found.id, created: false };
    }
    throw err;
  }
}

async function promoteToAdmin(token: string, id: string, email: string): Promise<void> {
  await api<UserResponse>('PATCH', `/users/${id}`, { role: 'admin', isActive: true }, token);
  console.log(`  ✓ PATCH /users/${id.slice(0, 8)}…  ${email.padEnd(36)} → admin`);
}

function printTable(
  rows: Array<{ email: string; id: string; role: string; status: string }>,
): void {
  const emailW = Math.max(...rows.map((r) => r.email.length), 5);
  const idW = 38;
  const roleW = 6;
  const statusW = 10;

  const header =
    `${'EMAIL'.padEnd(emailW)}  ` +
    `${'ID'.padEnd(idW)}  ` +
    `${'ROLE'.padEnd(roleW)}  ` +
    'STATUS';
  const sep = '─'.repeat(header.length);

  console.log('\n' + sep);
  console.log(header);
  console.log(sep);
  for (const r of rows) {
    console.log(
      `${r.email.padEnd(emailW)}  ` +
      `${r.id.padEnd(idW)}  ` +
      `${r.role.padEnd(roleW)}  ` +
      r.status,
    );
  }
  console.log(sep);
}

async function main(): Promise<void> {
  console.log('=== Seeding 8 test users via HTTP ===');
  console.log(`    baseUrl: ${BASE_URL}`);

  const token = await login();

  console.log('\n→ Creating 8 users (POST /users)…');
  const results: Array<{ user: SeedUser; id: string; created: boolean }> = [];
  for (const user of USERS) {
    const r = await createUser(token, user);
    results.push({ user, ...r });
  }

  console.log('\n→ Promoting 2 users to admin (PATCH /users/:id)…');
  for (const r of results.filter((x) => x.user.finalRole === 'admin')) {
    await promoteToAdmin(token, r.id, r.user.email);
  }

  // Re-fetch to get final role after promotion
  const list = await api<PaginatedUsers>('GET', '/users?page=1&limit=100', undefined, token);
  const byEmail = new Map(list.data.map((u) => [u.email, u]));

  printTable(
    results.map((r) => ({
      email: r.user.email,
      id: r.id,
      role: byEmail.get(r.user.email)?.role ?? r.user.finalRole,
      status: r.created ? 'created' : 'existed',
    })),
  );

  console.log('\n✓ Done. Usá los IDs de arriba en los pasos 6, 7.3 y 8 del doc.');
  console.log('  Para borrar todo: pnpm db:testing:users:cleanup');
}

main().catch((err: unknown) => {
  console.error('\n✗ FAILED:', err instanceof Error ? err.message : String(err));
  if (err instanceof ApiCallError && err.serverErrorId) {
    console.error(`  Server errorId: ${err.serverErrorId} (cross-reference with server logs)`);
  }
  process.exit(1);
});

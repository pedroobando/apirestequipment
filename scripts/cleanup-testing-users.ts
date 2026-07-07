/**
 * Cleanup script: deletes the 8 testing users created by seed-testing-users.ts.
 * Leaves the seed admins (admin@gmail.com, admin@example.com) untouched.
 *
 * Environment overrides:
 *   BASE_URL        (default: http://localhost:3000/api)
 *   ADMIN_EMAIL     (default: admin@gmail.com)
 *   ADMIN_PASSWORD  (default: c27174055#)
 *
 * Usage:
 *   pnpm db:testing:users:cleanup
 */

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] ?? 'admin@gmail.com';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] ?? 'c27174055#';

const PROTECTED_EMAILS = new Set<string>([
  'admin@gmail.com',
  'admin@example.com',
]);

const TESTING_EMAILS = new Set<string>([
  'admin.ops@apirestequip.com',
  'admin.support@apirestequip.com',
  'operator1@apirestequip.com',
  'operator2@apirestequip.com',
  'operator3@apirestequip.com',
  'operator4@apirestequip.com',
  'operator5@apirestequip.com',
  'operator6@apirestequip.com',
]);

interface UserResponse {
  id: string;
  email: string;
}

interface PaginatedUsers {
  data: UserResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status} ${res.statusText}\n${text}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function main(): Promise<void> {
  console.log('=== Cleanup: deleting 8 testing users ===');
  console.log(`    baseUrl: ${BASE_URL}`);

  const loginRes = await api<{ accessToken: string }>(
    'POST',
    '/auth/login',
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  );
  const token = loginRes.accessToken;

  // Pull all users (single page, limit=100 is the API max).
  // If the dataset grows past 100, paginate here.
  const list = await api<PaginatedUsers>('GET', '/users?page=1&limit=100', undefined, token);
  const targets = list.data.filter(
    (u) => TESTING_EMAILS.has(u.email) && !PROTECTED_EMAILS.has(u.email),
  );

  if (targets.length === 0) {
    console.log('\nNo testing users found. Nothing to delete.');
    return;
  }

  console.log(`\n→ Deleting ${targets.length} users…`);
  let ok = 0;
  let failed = 0;
  for (const u of targets) {
    try {
      await api('DELETE', `/users/${u.id}`, undefined, token);
      console.log(`  ✓ ${u.email.padEnd(36)} (${u.id})`);
      ok++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ✗ ${u.email.padEnd(36)} — ${msg}`);
      failed++;
    }
  }

  console.log(`\nDone. ${ok} deleted, ${failed} failed.`);
}

main().catch((err: unknown) => {
  console.error('\n✗ FAILED:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Load variables from a `.env` file into `process.env` if not already set.
 *
 * Idempotent and silent on missing files: if `.env` does not exist, this
 * function returns without throwing. Existing `process.env` entries are
 * never overwritten, so shell-exported values take precedence.
 *
 * This is a minimal `.env` parser — it does not handle quoted values with
 * embedded `=`, multi-line values, or shell expansion. Sufficient for
 * DATABASE_URL, JWT_SECRET, and other simple KV envs used by the seeds.
 */
export function loadEnv(envPath = resolve(process.cwd(), '.env')): void {
  let content: string;
  try {
    content = readFileSync(envPath, 'utf-8');
  } catch {
    return;
  }

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIdx = trimmed.indexOf('=');
    if (equalsIdx === -1) continue;

    const key = trimmed.slice(0, equalsIdx).trim();
    const value = trimmed.slice(equalsIdx + 1).trim();

    if (key && !Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

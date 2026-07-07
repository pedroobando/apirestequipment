import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { count } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as readline from 'readline';

import { users } from 'src/users/schema/users.schema';
import { operators } from 'src/operators/schema/operators.schema';
import { equipmentTypes } from 'src/equipment-types/schema/equipment-types.schema';
import { equipment } from 'src/equipment/schema/equipment.schema';
import { locations } from 'src/locations/schema/locations.schema';
import { missions } from 'src/missions/schema/missions.schema';

function loadEnv(): void {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
          process.env[key] = value;
        }
      }
    }
  } catch {
    // ignore missing .env
  }
}

interface TableMeta {
  name: string;
  schema: unknown;
}

const deleteOrder: TableMeta[] = [
  { name: 'missions', schema: missions },
  { name: 'locations', schema: locations },
  { name: 'equipment', schema: equipment },
  { name: 'operators', schema: operators },
  { name: 'equipment_types', schema: equipmentTypes },
  { name: 'users', schema: users },
];

const summaryOrder: TableMeta[] = [
  { name: 'users', schema: users },
  { name: 'operators', schema: operators },
  { name: 'equipment_types', schema: equipmentTypes },
  { name: 'equipment', schema: equipment },
  { name: 'locations', schema: locations },
  { name: 'missions', schema: missions },
];

async function getRowCounts(
  db: NodePgDatabase,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  await Promise.all(
    deleteOrder.map(async ({ name, schema }) => {
      const [result] = await db
        .select({ value: count() })
        .from(schema as PgTable);
      counts.set(name, Number(result?.value ?? 0));
    }),
  );
  return counts;
}

async function askConfirmation(totalRows: number): Promise<boolean> {
  if (process.env['CONFIRM_WIPE'] === '1') {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await new Promise<string>((resolveAnswer) => {
      rl.question(
        `Type WIPE to delete all ${totalRows} rows: `,
        (response) => {
          resolveAnswer(response.trim());
        },
      );
    });
    return answer === 'WIPE';
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  if (process.env['NODE_ENV'] === 'production') {
    console.error(
      'Refusing to run database wipe in production (NODE_ENV=production).',
    );
    process.exit(1);
  }

  loadEnv();

  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not defined. Add it to your .env file.',
    );
  }

  const pool = new Pool({ connectionString });
  const db: NodePgDatabase = drizzle(pool);

  try {
    const rowCounts = await getRowCounts(db);

    console.log('Database wipe plan:');
    let totalRows = 0;
    for (const { name } of summaryOrder) {
      const value = rowCounts.get(name) ?? 0;
      console.log(`- ${name}: ${value}`);
      totalRows += value;
    }
    console.log(`- TOTAL: ${totalRows} rows`);

    if (totalRows === 0) {
      console.log('\nDatabase is already empty. Nothing to delete.');
      return;
    }

    const confirmed = await askConfirmation(totalRows);
    if (!confirmed) {
      console.log('\nDatabase wipe cancelled.');
      return;
    }

    console.log('\nWiping database...');
    for (const { name, schema } of deleteOrder) {
      await db.delete(schema as PgTable).execute();
      const deletedCount = rowCounts.get(name) ?? 0;
      console.log(`✓ ${name}: ${deletedCount} rows deleted`);
    }

    console.log(`\n${totalRows} rows deleted successfully.`);
    console.log('Database wipe completed.');
  } catch (error) {
    console.error(
      '\nDatabase wipe failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    'Unexpected error:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});

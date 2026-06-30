import { Provider, Logger } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

export const databaseProviders: Provider[] = [
  {
    provide: DATABASE_CONNECTION,
    useFactory: (): NodePgDatabase => {
      const logger = new Logger('DatabaseProvider');
      const connectionString = process.env['DATABASE_URL'];

      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not defined');
      }

      const pool = new Pool({ connectionString });

      pool.on('error', (error: Error) => {
        logger.error(`Unexpected database error: ${error.message}`);
      });

      return drizzle(pool);
    },
  },
];

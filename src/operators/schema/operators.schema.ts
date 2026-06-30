import {
  pgTable,
  uuid,
  text,
  boolean,
  foreignKey,
  type ForeignKeyBuilder,
} from 'drizzle-orm/pg-core';
import { timestampColumns } from 'src/common/schema/timestamp';
import { users } from 'src/users/schema/users.schema';

export const operators = pgTable(
  'operators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    licenseNumber: text('license_number'),
    phone: text('phone'),
    role: text('role').notNull().default('driver'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestampColumns,
  },
  (table): ForeignKeyBuilder[] => [
    foreignKey({
      name: 'operators_user_id_fk',
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),
  ],
);

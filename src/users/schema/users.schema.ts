import { pgTable, uuid, text, boolean } from 'drizzle-orm/pg-core';
import { timestampColumns } from 'src/common/schema/timestamp';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  ...timestampColumns,
});

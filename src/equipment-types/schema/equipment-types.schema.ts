import { pgTable, uuid, text, boolean } from 'drizzle-orm/pg-core';
import { timestampColumns } from 'src/common/schema/timestamp';

export const equipmentTypes = pgTable('equipment_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestampColumns,
});

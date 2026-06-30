import {
  pgTable,
  uuid,
  decimal,
  real,
  text,
  timestamp as pgTimestamp,
  foreignKey,
  type ForeignKeyBuilder,
} from 'drizzle-orm/pg-core';
import { timestampColumns } from 'src/common/schema/timestamp';
import { equipment } from 'src/equipment/schema/equipment.schema';

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    equipmentId: uuid('equipment_id').notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    accuracy: real('accuracy'),
    source: text('source').notNull().default('manual'),
    recordedAt: pgTimestamp('recorded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestampColumns,
  },
  (table): ForeignKeyBuilder[] => [
    foreignKey({
      name: 'locations_equipment_id_fk',
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
    }).onDelete('cascade'),
  ],
);

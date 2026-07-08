import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp as pgTimestamp,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { timestampColumns } from 'src/common/schema/timestamp';
import { equipment } from 'src/equipment/schema/equipment.schema';
import { operators } from 'src/operators/schema/operators.schema';

export const equipmentMaintenance = pgTable(
  'equipment_maintenance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    equipmentId: uuid('equipment_id').notNull(),
    mechanicId: uuid('mechanic_id'),
    notes: text('notes'),
    reason: text('reason'),
    cost: integer('cost'),
    startedAt: pgTimestamp('started_at', { withTimezone: true }).defaultNow(),
    endedAt: pgTimestamp('ended_at', { withTimezone: true }),
    closedAt: pgTimestamp('closed_at', { withTimezone: true }),
    ...timestampColumns,
  },
  (table) => [
    foreignKey({
      name: 'equipment_maintenance_equipment_id_fk',
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'equipment_maintenance_mechanic_id_fk',
      columns: [table.mechanicId],
      foreignColumns: [operators.id],
    }).onDelete('set null'),
    index('equipment_maintenance_equipment_id_closed_at_idx').on(
      table.equipmentId,
      table.closedAt,
    ),
  ],
);

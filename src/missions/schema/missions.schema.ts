import {
  pgTable,
  uuid,
  text,
  timestamp as pgTimestamp,
  foreignKey,
  type ForeignKeyBuilder,
} from 'drizzle-orm/pg-core';
import { timestampColumns } from 'src/common/schema/timestamp';
import { users } from 'src/users/schema/users.schema';
import { equipment } from 'src/equipment/schema/equipment.schema';
import { operators } from 'src/operators/schema/operators.schema';

export enum MissionStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export const missions = pgTable(
  'missions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userIdCreator: uuid('user_id_creator').notNull(),
    equipmentId: uuid('equipment_id').notNull(),
    operatorId: uuid('operator_id'),
    title: text('title').notNull(),
    description: text('description'),
    origin: text('origin'),
    destination: text('destination'),
    status: text('status').notNull().default(MissionStatus.Pending),
    startedAt: pgTimestamp('started_at', { withTimezone: true }),
    completedAt: pgTimestamp('completed_at', { withTimezone: true }),
    ...timestampColumns,
  },
  (table): ForeignKeyBuilder[] => [
    foreignKey({
      name: 'missions_user_id_creator_fk',
      columns: [table.userIdCreator],
      foreignColumns: [users.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'missions_equipment_id_fk',
      columns: [table.equipmentId],
      foreignColumns: [equipment.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'missions_operator_id_fk',
      columns: [table.operatorId],
      foreignColumns: [operators.id],
    }).onDelete('set null'),
  ],
);

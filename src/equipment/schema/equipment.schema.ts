import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  foreignKey,
  type ForeignKeyBuilder,
} from 'drizzle-orm/pg-core';
import { timestampColumns } from 'src/common/schema/timestamp';
import { users } from 'src/users/schema/users.schema';
import { equipmentTypes } from 'src/equipment-types/schema/equipment-types.schema';
import { locations } from 'src/locations/schema/locations.schema';

export const equipment = pgTable(
  'equipment',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull(),
    equipmentTypeId: uuid('equipment_type_id').notNull(),
    currentLocationId: uuid('current_location_id'),
    brand: text('brand'),
    model: text('model'),
    year: integer('year'),
    plate: text('plate'),
    serialNumber: text('serial_number'),
    fuelType: text('fuel_type'),
    capacity: text('capacity'),
    status: text('status').notNull().default('available'),
    statusReason: text('status_reason'),
    origin: text('origin'),
    destination: text('destination'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestampColumns,
  },
  (table): ForeignKeyBuilder[] => [
    foreignKey({
      name: 'equipment_owner_id_fk',
      columns: [table.ownerId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),
    foreignKey({
      name: 'equipment_type_id_fk',
      columns: [table.equipmentTypeId],
      foreignColumns: [equipmentTypes.id],
    }).onDelete('restrict'),
    foreignKey({
      name: 'equipment_current_location_id_fk',
      columns: [table.currentLocationId],
      foreignColumns: [locations.id],
    }).onDelete('set null'),
  ],
);

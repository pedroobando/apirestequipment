import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { equipmentTypes } from 'src/equipment-types/schema/equipment-types.schema';

const seedEquipmentTypes = [
  { name: 'Ambulancia' },
  { name: 'Camioneta' },
  { name: 'Camion de carga' },
  { name: 'Camion de bomberos' },
  { name: 'Generador electrico' },
  { name: 'Planta electrica' },
  { name: 'Motobomba' },
  { name: 'Vehiculo de rescate' },
  { name: 'Maquinaria pesada' },
  { name: 'Equipo medico' },
  { name: 'Tanque de agua' },
  { name: 'Equipo de comunicaciones' },
];

async function main() {
  const connectionString = process.env['DATABASE_URL'];

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const pool = new Pool({ connectionString });
  const db: NodePgDatabase = drizzle(pool);

  try {
    await db
      .insert(equipmentTypes)
      .values(seedEquipmentTypes)
      .onConflictDoNothing({
        target: equipmentTypes.name,
      });

    console.log('Equipment types seeded successfully');
  } catch (error) {
    console.error('Failed to seed equipment types:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();

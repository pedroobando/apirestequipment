import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { users } from 'src/users/schema/users.schema';
import { operators } from 'src/operators/schema/operators.schema';
import { equipmentTypes } from 'src/equipment-types/schema/equipment-types.schema';
import { equipment } from 'src/equipment/schema/equipment.schema';
import { locations } from 'src/locations/schema/locations.schema';
import { missions, MissionStatus } from 'src/missions/schema/missions.schema';
import { Role } from 'src/common/enums/role.enum';
import { EquipmentStatus } from 'src/common/enums/equipment-status.enum';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
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

loadEnv();

const seedEquipmentTypes = [
  'Ambulancia',
  'Camioneta',
  'Camion de carga',
  'Camion de bomberos',
  'Generador electrico',
  'Planta electrica',
  'Motobomba',
  'Vehiculo de rescate',
  'Maquinaria pesada',
  'Equipo medico',
  'Tanque de agua',
  'Equipo de comunicaciones',
];

function assertDefined<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`Expected ${name} to be defined`);
  }
  return value;
}

async function main() {
  const connectionString = process.env['DATABASE_URL'];

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const pool = new Pool({ connectionString });
  const db: NodePgDatabase = drizzle(pool);

  try {
    await db.delete(missions);
    await db.delete(locations);
    await db.delete(equipment);
    await db.delete(operators);
    await db.delete(users);
    await db.delete(equipmentTypes);

    await db
      .insert(equipmentTypes)
      .values(seedEquipmentTypes.map((name) => ({ name })));

    const passwordHash = await bcrypt.hash('password123', 10);

    const insertedUsers = await db
      .insert(users)
      .values([
        {
          email: 'admin@example.com',
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: Role.Admin,
        },
        {
          email: 'operator1@example.com',
          passwordHash,
          firstName: 'Carlos',
          lastName: 'Perez',
          role: Role.User,
        },
        {
          email: 'operator2@example.com',
          passwordHash,
          firstName: 'Maria',
          lastName: 'Garcia',
          role: Role.User,
        },
      ])
      .returning();

    if (insertedUsers.length < 3) {
      throw new Error('Failed to insert seed users');
    }

    const adminUser = insertedUsers[0]!;
    const operatorUser1 = insertedUsers[1]!;
    const operatorUser2 = insertedUsers[2]!;

    const insertedOperators = await db
      .insert(operators)
      .values([
        {
          userId: operatorUser1.id,
          licenseNumber: 'LIC-001',
          phone: '04121234567',
          role: 'driver',
        },
        {
          userId: operatorUser2.id,
          licenseNumber: 'LIC-002',
          phone: '04261234567',
          role: 'technician',
        },
      ])
      .returning();

    if (insertedOperators.length < 2) {
      throw new Error('Failed to insert seed operators');
    }

    const operator1 = insertedOperators[0]!;
    const operator2 = insertedOperators[1]!;

    const equipmentTypeRows = await db
      .select()
      .from(equipmentTypes)
      .where(eq(equipmentTypes.name, 'Ambulancia'))
      .limit(1);

    const equipmentType = assertDefined(equipmentTypeRows[0], 'equipmentType');

    const insertedEquipment = await db
      .insert(equipment)
      .values([
        {
          ownerId: adminUser.id,
          operatorId: operator1.id,
          equipmentTypeId: equipmentType.id,
          brand: 'Toyota',
          model: 'Hilux',
          year: 2022,
          plate: 'ABC123',
          serialNumber: 'SN123456',
          fuelType: 'gasoline',
          capacity: '1000kg',
          status: EquipmentStatus.Available,
        },
        {
          ownerId: adminUser.id,
          operatorId: operator2.id,
          equipmentTypeId: equipmentType.id,
          brand: 'Ford',
          model: 'F-350',
          year: 2021,
          plate: 'DEF456',
          serialNumber: 'SN789012',
          fuelType: 'diesel',
          capacity: '5000kg',
          status: EquipmentStatus.InUse,
        },
      ])
      .returning();

    if (insertedEquipment.length < 2) {
      throw new Error('Failed to insert seed equipment');
    }

    const equipment1 = insertedEquipment[0]!;
    const equipment2 = insertedEquipment[1]!;

    const insertedLocations = await db
      .insert(locations)
      .values([
        {
          equipmentId: equipment1.id,
          latitude: '10.4806',
          longitude: '-66.9036',
          accuracy: 5.0,
          source: 'manual',
        },
        {
          equipmentId: equipment2.id,
          latitude: '10.5000',
          longitude: '-66.9200',
          accuracy: 8.5,
          source: 'manual',
        },
      ])
      .returning();

    const location1 = assertDefined(insertedLocations[0], 'location1');

    await db
      .update(equipment)
      .set({ currentLocationId: location1.id })
      .where(eq(equipment.id, equipment1.id));

    await db.insert(missions).values([
      {
        userIdCreator: adminUser.id,
        equipmentId: equipment1.id,
        operatorId: operator1.id,
        title: 'Entrega de insumos medicos',
        description: 'Traslado de medicamentos al hospital central',
        origin: 'Caracas',
        destination: 'Valencia',
        status: MissionStatus.InProgress,
        startedAt: new Date(),
      },
      {
        userIdCreator: adminUser.id,
        equipmentId: equipment2.id,
        operatorId: operator2.id,
        title: 'Rescate en zona afectada',
        description: 'Apoyo en zona inundada',
        origin: 'Maiquetia',
        destination: 'La Guaira',
        status: MissionStatus.Pending,
      },
    ]);

    console.log('Development seed completed successfully');
  } catch (error) {
    console.error('Failed to seed development data:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();

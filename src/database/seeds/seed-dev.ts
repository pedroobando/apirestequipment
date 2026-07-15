import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as readline from 'node:readline';
import bcrypt from 'bcrypt';
import { users } from 'src/users/schema/users.schema';
import { operators } from 'src/operators/schema/operators.schema';
import { equipmentTypes } from 'src/equipment-types/schema/equipment-types.schema';
import { equipment } from 'src/equipment/schema/equipment.schema';
import { locations } from 'src/locations/schema/locations.schema';
import { missions, MissionStatus } from 'src/missions/schema/missions.schema';
import { Role } from 'src/common/enums/role.enum';
import { EquipmentStatus } from 'src/common/enums/equipment-status.enum';
import { OperatorRole } from 'src/common/enums/operator-role.enum';
import { loadEnv } from './load-env';

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

/**
 * The seed is destructive: it wipes every table before reseeding. To avoid
 * silent data loss we require an explicit confirmation, mirroring the
 * pattern in `scripts/wipe-database.ts`:
 *   - `CONFIRM_DEV_SEED_WIPE=1` in the env (for CI / scripted runs)
 *   - or an interactive `yes` prompt when stdin is a TTY
 * In any other case the seed aborts with a clear message.
 */
async function confirmDestructiveSeed(): Promise<boolean> {
  if (process.env['CONFIRM_DEV_SEED_WIPE'] === '1') {
    return true;
  }

  if (!process.stdin.isTTY) {
    console.error(
      'Refusing to wipe: this seed is destructive. Re-run with CONFIRM_DEV_SEED_WIPE=1 ' +
        'or interactively from a terminal to confirm.',
    );
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await new Promise<string>((resolveAnswer) => {
      rl.question(
        'This will DELETE ALL existing rows in the dev database. ' +
          'Type YES to continue: ',
        (response) => resolveAnswer(response.trim()),
      );
    });
    return answer === 'YES';
  } finally {
    rl.close();
  }
}

async function main() {
  const connectionString = process.env['DATABASE_URL'];

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const pool = new Pool({ connectionString });
  const db: NodePgDatabase = drizzle(pool);

  const confirmed = await confirmDestructiveSeed();
  if (!confirmed) {
    await pool.end();
    process.exit(0);
  }

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
    const adminPasswordHash = await bcrypt.hash('c27174055#', 10);

    const insertedUsers = await db
      .insert(users)
      .values([
        {
          email: 'admin@gmail.com',
          passwordHash: adminPasswordHash,
          firstName: 'administrador',
          lastName: 'Ingallina',
          phone: '+584143433453',
          role: Role.Admin,
        },
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
          role: OperatorRole.Driver,
        },
        {
          userId: operatorUser2.id,
          licenseNumber: 'LIC-002',
          phone: '04261234567',
          role: OperatorRole.Mechanic,
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

import { randomUUID } from 'node:crypto';
import { EquipmentStatus } from 'src/common/enums/equipment-status.enum';
import type { IEquipmentType } from 'src/equipment-types/interfaces/equipment-type.interface';
import type { IOperator } from 'src/operators/interfaces/operator.interface';
import type { IEquipment } from 'src/equipment/interfaces/equipment.interface';

export type EquipmentTypeOverrides = Partial<IEquipmentType>;
export type OperatorOverrides = Partial<IOperator>;
export type EquipmentOverrides = Partial<IEquipment>;

export function buildEquipmentType(
  overrides: EquipmentTypeOverrides = {},
): IEquipmentType {
  const now = new Date();

  return {
    id: randomUUID(),
    name: 'Ambulancia',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function buildOperator(overrides: OperatorOverrides = {}): IOperator {
  const now = new Date();

  return {
    id: randomUUID(),
    userId: randomUUID(),
    licenseNumber: 'LIC-001',
    phone: '+584141234567',
    role: 'driver',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function buildEquipment(overrides: EquipmentOverrides = {}): IEquipment {
  const now = new Date();

  return {
    id: randomUUID(),
    ownerId: randomUUID(),
    operatorId: null,
    equipmentTypeId: randomUUID(),
    brand: 'Toyota',
    model: 'Hilux',
    year: 2020,
    plate: 'ABC123',
    serialNumber: 'SN123456',
    fuelType: 'gasoline',
    capacity: '1 ton',
    status: EquipmentStatus.Available,
    statusReason: null,
    origin: null,
    destination: null,
    currentLocationId: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export const EQUIPMENT_TYPES_FIXTURE: IEquipmentType[] = [
  buildEquipmentType({ name: 'Ambulancia' }),
  buildEquipmentType({ name: 'Camioneta' }),
  buildEquipmentType({ name: 'Camion de carga' }),
  buildEquipmentType({ name: 'Camion de bomberos' }),
  buildEquipmentType({ name: 'Planta electrica' }),
];

export const OPERATORS_FIXTURE: IOperator[] = [
  buildOperator({ licenseNumber: 'LIC-001', phone: '+584141234567' }),
  buildOperator({ licenseNumber: 'LIC-002', phone: '+584142345678' }),
  buildOperator({ licenseNumber: 'LIC-003', phone: '+584143456789' }),
  buildOperator({ licenseNumber: 'LIC-004', phone: '+584144567890' }),
  buildOperator({ licenseNumber: 'LIC-005', phone: '+584145678901' }),
];

export function buildEquipmentListForTypes(
  types: IEquipmentType[],
): IEquipment[] {
  const equipmentList: IEquipment[] = [];

  for (const type of types) {
    const count = Math.floor(Math.random() * 6) + 7;

    for (let i = 0; i < count; i++) {
      const operator =
        Math.random() > 0.3
          ? OPERATORS_FIXTURE[Math.floor(Math.random() * OPERATORS_FIXTURE.length)] ?? null
          : null;

      equipmentList.push(
        buildEquipment({
          equipmentTypeId: type.id,
          ownerId: randomUUID(),
          operatorId: operator?.id ?? null,
          plate: `${type.name.substring(0, 3).toUpperCase()}-${i + 1}`,
        }),
      );
    }
  }

  return equipmentList;
}

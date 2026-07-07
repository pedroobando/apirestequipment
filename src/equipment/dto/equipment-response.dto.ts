import { IEquipment } from '../interfaces/equipment.interface';

export class EquipmentResponseDto {
  id: string;
  ownerId: string;
  equipmentTypeId: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  serialNumber: string | null;
  fuelType: string | null;
  capacity: string | null;
  status: string;
  statusReason: string | null;
  origin: string | null;
  destination: string | null;
  currentLocationId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(equipment: IEquipment) {
    this.id = equipment.id;
    this.ownerId = equipment.ownerId;
    this.equipmentTypeId = equipment.equipmentTypeId;
    this.brand = equipment.brand;
    this.model = equipment.model;
    this.year = equipment.year;
    this.plate = equipment.plate;
    this.serialNumber = equipment.serialNumber;
    this.fuelType = equipment.fuelType;
    this.capacity = equipment.capacity;
    this.status = equipment.status;
    this.statusReason = equipment.statusReason;
    this.origin = equipment.origin;
    this.destination = equipment.destination;
    this.currentLocationId = equipment.currentLocationId;
    this.isActive = equipment.isActive;
    this.createdAt = equipment.createdAt;
    this.updatedAt = equipment.updatedAt;
  }
}

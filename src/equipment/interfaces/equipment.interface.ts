export interface IEquipment {
  id: string;
  ownerId: string;
  operatorId: string | null;
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
}

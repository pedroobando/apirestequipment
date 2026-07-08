import { IEquipmentMaintenance } from '../interfaces/equipment-maintenance.interface';

export class EquipmentMaintenanceResponseDto {
  id: string;
  equipmentId: string;
  mechanicId: string | null;
  notes: string | null;
  reason: string | null;
  cost: number | null;
  startedAt: Date | null;
  endedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(record: IEquipmentMaintenance) {
    this.id = record.id;
    this.equipmentId = record.equipmentId;
    this.mechanicId = record.mechanicId;
    this.notes = record.notes;
    this.reason = record.reason;
    this.cost = record.cost;
    this.startedAt = record.startedAt;
    this.endedAt = record.endedAt;
    this.closedAt = record.closedAt;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }
}

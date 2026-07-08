export interface IEquipmentMaintenance {
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
}

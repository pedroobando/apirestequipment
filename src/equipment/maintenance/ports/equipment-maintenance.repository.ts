import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateEquipmentMaintenanceDto } from '../dto/create-equipment-maintenance.dto';
import { UpdateEquipmentMaintenanceDto } from '../dto/update-equipment-maintenance.dto';
import { IEquipmentMaintenance } from '../interfaces/equipment-maintenance.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN = Symbol(
  'EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN',
);
export type DbClient = NodePgDatabase;

export interface IEquipmentMaintenanceRepository {
  findAllByEquipmentId(
    equipmentId: string,
    pagination: PaginationDto,
  ): Promise<{ items: IEquipmentMaintenance[]; total: number }>;
  findOpenByEquipmentId(
    equipmentId: string,
  ): Promise<IEquipmentMaintenance | null>;
  create(
    data: CreateEquipmentMaintenanceDto & { equipmentId: string },
    client?: DbClient,
  ): Promise<IEquipmentMaintenance>;
  update(
    id: string,
    data: UpdateEquipmentMaintenanceDto,
    client?: DbClient,
  ): Promise<IEquipmentMaintenance>;
  closeRecord(id: string, client?: DbClient): Promise<IEquipmentMaintenance>;
  delete(id: string, client?: DbClient): Promise<IEquipmentMaintenance>;
}

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';
import { IEquipment } from '../interfaces/equipment.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const EQUIPMENT_REPOSITORY_TOKEN = Symbol('EQUIPMENT_REPOSITORY_TOKEN');
export type DbClient = NodePgDatabase;

export interface IEquipmentRepository {
  findAll(
    pagination: PaginationDto,
    filters?: {
      status?: string;
      equipmentTypeId?: string;
      isActive?: boolean;
    },
  ): Promise<{ items: IEquipment[]; total: number }>;
  findById(id: string): Promise<IEquipment | null>;
  findByPlate(plate: string): Promise<IEquipment | null>;
  create(data: CreateEquipmentDto, client?: DbClient): Promise<IEquipment>;
  update(id: string, data: UpdateEquipmentDto): Promise<IEquipment>;
  softDelete(id: string): Promise<IEquipment>;
}

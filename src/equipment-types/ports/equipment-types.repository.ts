import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateEquipmentTypeDto } from '../dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from '../dto/update-equipment-type.dto';
import { IEquipmentType } from '../interfaces/equipment-type.interface';

export const EQUIPMENT_TYPES_REPOSITORY_TOKEN = Symbol(
  'EQUIPMENT_TYPES_REPOSITORY_TOKEN',
);
export type DbClient = NodePgDatabase;

export interface IEquipmentTypesRepository {
  findAll(): Promise<IEquipmentType[]>;
  findById(id: string): Promise<IEquipmentType | null>;
  findByName(name: string): Promise<IEquipmentType | null>;
  create(
    data: CreateEquipmentTypeDto,
    client?: DbClient,
  ): Promise<IEquipmentType>;
  update(id: string, data: UpdateEquipmentTypeDto): Promise<IEquipmentType>;
  softDelete(id: string): Promise<IEquipmentType>;
}

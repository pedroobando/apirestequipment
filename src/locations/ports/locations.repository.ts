import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateLocationDto } from '../dto/create-location.dto';
import { RadiusQueryDto } from '../dto/radius-query.dto';
import { ILocation } from '../interfaces/location.interface';

export const LOCATIONS_REPOSITORY_TOKEN = Symbol.for(
  'LOCATIONS_REPOSITORY_TOKEN',
);
export type DbClient = NodePgDatabase;

export interface ILocationsRepository {
  create(data: CreateLocationDto, client?: DbClient): Promise<ILocation>;
  findByEquipmentId(equipmentId: string, limit?: number): Promise<ILocation[]>;
  findWithinRadius(query: RadiusQueryDto): Promise<ILocation[]>;
  getLatestByEquipmentId(equipmentId: string): Promise<ILocation | null>;
}

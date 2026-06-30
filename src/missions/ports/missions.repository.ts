import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateMissionDto } from '../dto/create-mission.dto';
import { UpdateMissionDto } from '../dto/update-mission.dto';
import { IMission } from '../interfaces/mission.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const MISSIONS_REPOSITORY_TOKEN = Symbol('MISSIONS_REPOSITORY_TOKEN');
export type DbClient = NodePgDatabase;

export interface IMissionsRepository {
  findAll(
    pagination: PaginationDto,
    filters?: {
      status?: string;
      equipmentId?: string;
      operatorId?: string;
    },
  ): Promise<{ items: IMission[]; total: number }>;
  findById(id: string): Promise<IMission | null>;
  create(data: CreateMissionDto, client?: DbClient): Promise<IMission>;
  update(id: string, data: UpdateMissionDto): Promise<IMission>;
  softDelete(id: string): Promise<IMission>;
}

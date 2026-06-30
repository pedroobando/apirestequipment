import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { missions } from '../schema/missions.schema';
import { CreateMissionDto } from '../dto/create-mission.dto';
import { UpdateMissionDto } from '../dto/update-mission.dto';
import { IMission } from '../interfaces/mission.interface';
import { IMissionsRepository, DbClient } from '../ports/missions.repository';
import { tryCatch } from 'src/common/utils/try-catch';
import { mapDatabaseError } from 'src/common/utils/map-database-error';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleMissionsRepository implements IMissionsRepository {
  private readonly logger = new Logger(DrizzleMissionsRepository.name);

  private readonly selectMission = {
    id: missions.id,
    userIdCreator: missions.userIdCreator,
    equipmentId: missions.equipmentId,
    operatorId: missions.operatorId,
    title: missions.title,
    description: missions.description,
    origin: missions.origin,
    destination: missions.destination,
    status: missions.status,
    startedAt: missions.startedAt,
    completedAt: missions.completedAt,
    createdAt: missions.createdAt,
    updatedAt: missions.updatedAt,
  } as const;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: {
      status?: string;
      equipmentId?: string;
      operatorId?: string;
    },
  ): Promise<{ items: IMission[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.limit;

    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(missions.status, filters.status));
    }

    if (filters?.equipmentId) {
      conditions.push(eq(missions.equipmentId, filters.equipmentId));
    }

    if (filters?.operatorId) {
      conditions.push(eq(missions.operatorId, filters.operatorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [itemsResult, countResult] = await Promise.all([
      tryCatch(
        this.db
          .select(this.selectMission)
          .from(missions)
          .where(whereClause)
          .limit(pagination.limit)
          .offset(offset),
      ),
      tryCatch(
        this.db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(missions)
          .where(whereClause),
      ),
    ]);

    const [items, itemsError] = itemsResult;
    const [countRows, countError] = countResult;

    if (itemsError || countError || !items || !countRows) {
      this.logger.error(
        `findAll - ${itemsError?.message ?? countError?.message}`,
      );
      throw mapDatabaseError(itemsError ?? countError ?? undefined);
    }

    return { items, total: countRows[0]!.count };
  }

  async findById(id: string): Promise<IMission | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectMission)
        .from(missions)
        .where(eq(missions.id, id))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findById - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async create(
    data: CreateMissionDto,
    client: DbClient = this.db,
  ): Promise<IMission> {
    const [result, error] = await tryCatch(
      client.insert(missions).values(data).returning(this.selectMission),
    );

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async update(id: string, data: UpdateMissionDto): Promise<IMission> {
    const [result, error] = await tryCatch(
      this.db
        .update(missions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(missions.id, id))
        .returning(this.selectMission),
    );

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async softDelete(id: string): Promise<IMission> {
    const [result, error] = await tryCatch(
      this.db
        .delete(missions)
        .where(eq(missions.id, id))
        .returning(this.selectMission),
    );

    if (error || !result) {
      this.logger.error(`softDelete - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }
}

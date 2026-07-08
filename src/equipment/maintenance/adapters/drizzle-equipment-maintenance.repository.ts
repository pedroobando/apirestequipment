import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql, and, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { equipmentMaintenance } from '../schema/equipment-maintenance.schema';
import { CreateEquipmentMaintenanceDto } from '../dto/create-equipment-maintenance.dto';
import { UpdateEquipmentMaintenanceDto } from '../dto/update-equipment-maintenance.dto';
import { IEquipmentMaintenance } from '../interfaces/equipment-maintenance.interface';
import {
  IEquipmentMaintenanceRepository,
  DbClient,
} from '../ports/equipment-maintenance.repository';
import { tryCatch } from 'src/common/utils/try-catch';
import { mapDatabaseError } from 'src/common/utils/map-database-error';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleEquipmentMaintenanceRepository implements IEquipmentMaintenanceRepository {
  private readonly logger = new Logger(
    DrizzleEquipmentMaintenanceRepository.name,
  );

  private readonly selectMaintenance = {
    id: equipmentMaintenance.id,
    equipmentId: equipmentMaintenance.equipmentId,
    mechanicId: equipmentMaintenance.mechanicId,
    notes: equipmentMaintenance.notes,
    reason: equipmentMaintenance.reason,
    cost: equipmentMaintenance.cost,
    startedAt: equipmentMaintenance.startedAt,
    endedAt: equipmentMaintenance.endedAt,
    closedAt: equipmentMaintenance.closedAt,
    createdAt: equipmentMaintenance.createdAt,
    updatedAt: equipmentMaintenance.updatedAt,
  } as const;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findAllByEquipmentId(
    equipmentId: string,
    pagination: PaginationDto,
  ): Promise<{ items: IEquipmentMaintenance[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.limit;

    const [itemsResult, countResult] = await Promise.all([
      tryCatch(
        this.db
          .select(this.selectMaintenance)
          .from(equipmentMaintenance)
          .where(eq(equipmentMaintenance.equipmentId, equipmentId))
          .limit(pagination.limit)
          .offset(offset),
      ),
      tryCatch(
        this.db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(equipmentMaintenance)
          .where(eq(equipmentMaintenance.equipmentId, equipmentId)),
      ),
    ]);

    const [items, itemsError] = itemsResult;
    const [countRows, countError] = countResult;

    if (itemsError || countError || !items || !countRows) {
      this.logger.error(
        `findAllByEquipmentId - ${itemsError?.message ?? countError?.message}`,
      );
      throw mapDatabaseError(itemsError ?? countError ?? undefined);
    }

    return { items, total: countRows[0]!.count };
  }

  async findOpenByEquipmentId(
    equipmentId: string,
  ): Promise<IEquipmentMaintenance | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectMaintenance)
        .from(equipmentMaintenance)
        .where(
          and(
            eq(equipmentMaintenance.equipmentId, equipmentId),
            isNull(equipmentMaintenance.closedAt),
          ),
        )
        .orderBy(sql`${equipmentMaintenance.createdAt} desc`)
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findOpenByEquipmentId - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async create(
    data: CreateEquipmentMaintenanceDto & { equipmentId: string },
    client: DbClient = this.db,
  ): Promise<IEquipmentMaintenance> {
    const [result, error] = await tryCatch(
      client
        .insert(equipmentMaintenance)
        .values({
          equipmentId: data.equipmentId,
          mechanicId: data.mechanicId,
          notes: data.notes,
          reason: data.reason,
          cost: data.cost,
        })
        .returning(this.selectMaintenance),
    );

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async update(
    id: string,
    data: UpdateEquipmentMaintenanceDto,
    client: DbClient = this.db,
  ): Promise<IEquipmentMaintenance> {
    const [result, error] = await tryCatch(
      client
        .update(equipmentMaintenance)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(equipmentMaintenance.id, id))
        .returning(this.selectMaintenance),
    );

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async closeRecord(
    id: string,
    client: DbClient = this.db,
  ): Promise<IEquipmentMaintenance> {
    const [result, error] = await tryCatch(
      client
        .update(equipmentMaintenance)
        .set({
          closedAt: new Date(),
          endedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(equipmentMaintenance.id, id))
        .returning(this.selectMaintenance),
    );

    if (error || !result) {
      this.logger.error(`closeRecord - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async delete(
    id: string,
    client: DbClient = this.db,
  ): Promise<IEquipmentMaintenance> {
    const [result, error] = await tryCatch(
      client
        .delete(equipmentMaintenance)
        .where(eq(equipmentMaintenance.id, id))
        .returning(this.selectMaintenance),
    );

    if (error || !result) {
      this.logger.error(`delete - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }
}

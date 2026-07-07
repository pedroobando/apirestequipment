import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { equipment } from '../schema/equipment.schema';
import { CreateEquipmentDto } from '../dto/create-equipment.dto';
import { UpdateEquipmentDto } from '../dto/update-equipment.dto';
import { IEquipment } from '../interfaces/equipment.interface';
import { IEquipmentRepository, DbClient } from '../ports/equipment.repository';
import { tryCatch } from 'src/common/utils/try-catch';
import { mapDatabaseError } from 'src/common/utils/map-database-error';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleEquipmentRepository implements IEquipmentRepository {
  private readonly logger = new Logger(DrizzleEquipmentRepository.name);

  private readonly selectEquipment = {
    id: equipment.id,
    ownerId: equipment.ownerId,
    equipmentTypeId: equipment.equipmentTypeId,
    brand: equipment.brand,
    model: equipment.model,
    year: equipment.year,
    plate: equipment.plate,
    serialNumber: equipment.serialNumber,
    fuelType: equipment.fuelType,
    capacity: equipment.capacity,
    status: equipment.status,
    statusReason: equipment.statusReason,
    origin: equipment.origin,
    destination: equipment.destination,
    currentLocationId: equipment.currentLocationId,
    isActive: equipment.isActive,
    createdAt: equipment.createdAt,
    updatedAt: equipment.updatedAt,
  } as const;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: {
      status?: string;
      equipmentTypeId?: string;
      isActive?: boolean;
    },
  ): Promise<{ items: IEquipment[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.limit;

    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(equipment.status, filters.status));
    }

    if (filters?.equipmentTypeId) {
      conditions.push(eq(equipment.equipmentTypeId, filters.equipmentTypeId));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(equipment.isActive, filters.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [itemsResult, countResult] = await Promise.all([
      tryCatch(
        this.db
          .select(this.selectEquipment)
          .from(equipment)
          .where(whereClause)
          .limit(pagination.limit)
          .offset(offset),
      ),
      tryCatch(
        this.db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(equipment)
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

  async findById(id: string): Promise<IEquipment | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectEquipment)
        .from(equipment)
        .where(eq(equipment.id, id))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findById - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async findByPlate(plate: string): Promise<IEquipment | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectEquipment)
        .from(equipment)
        .where(eq(equipment.plate, plate))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findByPlate - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async create(
    data: CreateEquipmentDto,
    client: DbClient = this.db,
  ): Promise<IEquipment> {
    const [result, error] = await tryCatch(
      client.insert(equipment).values(data).returning(this.selectEquipment),
    );

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async update(id: string, data: UpdateEquipmentDto): Promise<IEquipment> {
    const [result, error] = await tryCatch(
      this.db
        .update(equipment)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(equipment.id, id))
        .returning(this.selectEquipment),
    );

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async softDelete(id: string): Promise<IEquipment> {
    const [result, error] = await tryCatch(
      this.db
        .update(equipment)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(equipment.id, id))
        .returning(this.selectEquipment),
    );

    if (error || !result) {
      this.logger.error(`softDelete - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { equipmentTypes } from '../schema/equipment-types.schema';
import { CreateEquipmentTypeDto } from '../dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from '../dto/update-equipment-type.dto';
import { IEquipmentType } from '../interfaces/equipment-type.interface';
import {
  IEquipmentTypesRepository,
  DbClient,
} from '../ports/equipment-types.repository';
import { tryCatch } from 'src/common/utils/try-catch';
import { mapDatabaseError } from 'src/common/utils/map-database-error';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleEquipmentTypesRepository implements IEquipmentTypesRepository {
  private readonly logger = new Logger(DrizzleEquipmentTypesRepository.name);

  private readonly selectEquipmentType = {
    id: equipmentTypes.id,
    name: equipmentTypes.name,
    isActive: equipmentTypes.isActive,
    createdAt: equipmentTypes.createdAt,
    updatedAt: equipmentTypes.updatedAt,
  } as const;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findAll(): Promise<IEquipmentType[]> {
    const [result, error] = await tryCatch(
      this.db.select(this.selectEquipmentType).from(equipmentTypes),
    );

    if (error || !result) {
      this.logger.error(`findAll - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result;
  }

  async findById(id: string): Promise<IEquipmentType | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectEquipmentType)
        .from(equipmentTypes)
        .where(eq(equipmentTypes.id, id))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findById - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async findByName(name: string): Promise<IEquipmentType | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectEquipmentType)
        .from(equipmentTypes)
        .where(eq(equipmentTypes.name, name))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findByName - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async create(
    data: CreateEquipmentTypeDto,
    client: DbClient = this.db,
  ): Promise<IEquipmentType> {
    const [result, error] = await tryCatch(
      client
        .insert(equipmentTypes)
        .values(data)
        .returning(this.selectEquipmentType),
    );

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async update(
    id: string,
    data: UpdateEquipmentTypeDto,
  ): Promise<IEquipmentType> {
    const [result, error] = await tryCatch(
      this.db
        .update(equipmentTypes)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(equipmentTypes.id, id))
        .returning(this.selectEquipmentType),
    );

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async softDelete(id: string): Promise<IEquipmentType> {
    const [result, error] = await tryCatch(
      this.db
        .update(equipmentTypes)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(equipmentTypes.id, id))
        .returning(this.selectEquipmentType),
    );

    if (error || !result) {
      this.logger.error(`softDelete - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }
}

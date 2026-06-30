import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { operators } from '../schema/operators.schema';
import { CreateOperatorDto } from '../dto/create-operator.dto';
import { UpdateOperatorDto } from '../dto/update-operator.dto';
import { IOperator } from '../interfaces/operator.interface';
import { IOperatorsRepository, DbClient } from '../ports/operators.repository';
import { tryCatch } from 'src/common/utils/try-catch';
import { mapDatabaseError } from 'src/common/utils/map-database-error';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleOperatorsRepository implements IOperatorsRepository {
  private readonly logger = new Logger(DrizzleOperatorsRepository.name);

  private readonly selectOperator = {
    id: operators.id,
    userId: operators.userId,
    licenseNumber: operators.licenseNumber,
    phone: operators.phone,
    role: operators.role,
    isActive: operators.isActive,
    createdAt: operators.createdAt,
    updatedAt: operators.updatedAt,
  } as const;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findAll(
    pagination: PaginationDto,
  ): Promise<{ items: IOperator[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.limit;

    const [itemsResult, countResult] = await Promise.all([
      tryCatch(
        this.db
          .select(this.selectOperator)
          .from(operators)
          .limit(pagination.limit)
          .offset(offset),
      ),
      tryCatch(
        this.db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(operators),
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

  async findById(id: string): Promise<IOperator | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectOperator)
        .from(operators)
        .where(eq(operators.id, id))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findById - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async findByUserId(userId: string): Promise<IOperator | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectOperator)
        .from(operators)
        .where(eq(operators.userId, userId))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findByUserId - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async create(
    data: CreateOperatorDto,
    client: DbClient = this.db,
  ): Promise<IOperator> {
    const [result, error] = await tryCatch(
      client.insert(operators).values(data).returning(this.selectOperator),
    );

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async update(id: string, data: UpdateOperatorDto): Promise<IOperator> {
    const [result, error] = await tryCatch(
      this.db
        .update(operators)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(operators.id, id))
        .returning(this.selectOperator),
    );

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async softDelete(id: string): Promise<IOperator> {
    const [result, error] = await tryCatch(
      this.db
        .update(operators)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(operators.id, id))
        .returning(this.selectOperator),
    );

    if (error || !result) {
      this.logger.error(`softDelete - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }
}

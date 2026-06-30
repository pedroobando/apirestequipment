import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { users } from '../schema/users.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IUser } from '../interfaces/user.interface';
import { IUsersRepository, DbClient } from '../ports/users.repository';
import { tryCatch } from 'src/common/utils/try-catch';
import { mapDatabaseError } from 'src/common/utils/map-database-error';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleUsersRepository implements IUsersRepository {
  private readonly logger = new Logger(DrizzleUsersRepository.name);

  private readonly selectUser = {
    id: users.id,
    email: users.email,
    passwordHash: users.passwordHash,
    firstName: users.firstName,
    lastName: users.lastName,
    phone: users.phone,
    role: users.role,
    provider: users.provider,
    providerId: users.providerId,
    isActive: users.isActive,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  } as const;

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase,
  ) {}

  async findAll(
    pagination: PaginationDto,
  ): Promise<{ items: IUser[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.limit;

    const [itemsResult, countResult] = await Promise.all([
      tryCatch(
        this.db
          .select(this.selectUser)
          .from(users)
          .limit(pagination.limit)
          .offset(offset),
      ),
      tryCatch(
        this.db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(users),
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

  async findById(id: string): Promise<IUser | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectUser)
        .from(users)
        .where(eq(users.id, id))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findById - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const [result, error] = await tryCatch(
      this.db
        .select(this.selectUser)
        .from(users)
        .where(eq(users.email, email))
        .limit(1),
    );

    if (error || !result) {
      this.logger.error(`findByEmail - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0] ?? null;
  }

  async create(
    data: CreateUserDto,
    client: DbClient = this.db,
  ): Promise<IUser> {
    const [result, error] = await tryCatch(
      client.insert(users).values(data).returning(this.selectUser),
    );

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async update(id: string, data: UpdateUserDto): Promise<IUser> {
    const [result, error] = await tryCatch(
      this.db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning(this.selectUser),
    );

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }

  async remove(id: string): Promise<IUser> {
    const [result, error] = await tryCatch(
      this.db
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning(this.selectUser),
    );

    if (error || !result) {
      this.logger.error(`remove - ${error?.message}`);
      throw mapDatabaseError(error ?? undefined);
    }

    return result[0]!;
  }
}

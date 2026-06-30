import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IUser } from '../interfaces/user.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const USERS_REPOSITORY_TOKEN = Symbol('USERS_REPOSITORY_TOKEN');
export type DbClient = NodePgDatabase;

export interface IUsersRepository {
  findAll(
    pagination: PaginationDto,
  ): Promise<{ items: IUser[]; total: number }>;
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(data: CreateUserDto, client?: DbClient): Promise<IUser>;
  update(id: string, data: UpdateUserDto): Promise<IUser>;
  remove(id: string): Promise<IUser>;
}

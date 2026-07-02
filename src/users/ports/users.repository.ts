import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IUser } from '../interfaces/user.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const USERS_REPOSITORY_TOKEN = Symbol('USERS_REPOSITORY_TOKEN');
export type DbClient = NodePgDatabase;

export type CreateUserData = Omit<CreateUserDto, 'password'> & {
  passwordHash: string;
};

export type UpdateUserData = Omit<UpdateUserDto, 'password'> & {
  passwordHash?: string;
};

export interface IUsersRepository {
  findAll(
    pagination: PaginationDto,
  ): Promise<{ items: IUser[]; total: number }>;
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(data: CreateUserData, client?: DbClient): Promise<IUser>;
  update(id: string, data: UpdateUserData): Promise<IUser>;
  remove(id: string): Promise<IUser>;
}

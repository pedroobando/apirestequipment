import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { CreateOperatorDto } from '../dto/create-operator.dto';
import { UpdateOperatorDto } from '../dto/update-operator.dto';
import { IOperator } from '../interfaces/operator.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export const OPERATORS_REPOSITORY_TOKEN = Symbol('OPERATORS_REPOSITORY_TOKEN');
export type DbClient = NodePgDatabase;

export interface IOperatorsRepository {
  findAll(
    pagination: PaginationDto,
  ): Promise<{ items: IOperator[]; total: number }>;
  findById(id: string): Promise<IOperator | null>;
  findByUserId(userId: string): Promise<IOperator | null>;
  create(data: CreateOperatorDto, client?: DbClient): Promise<IOperator>;
  update(id: string, data: UpdateOperatorDto): Promise<IOperator>;
  softDelete(id: string): Promise<IOperator>;
}

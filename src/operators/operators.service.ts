import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { OPERATORS_REPOSITORY_TOKEN } from './ports/operators.repository';
import type { IOperatorsRepository } from './ports/operators.repository';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { IOperator } from './interfaces/operator.interface';
import { tryCatch } from 'src/common/utils/try-catch';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';

@Injectable()
export class OperatorsService {
  private readonly logger = new Logger(OperatorsService.name);

  constructor(
    @Inject(OPERATORS_REPOSITORY_TOKEN)
    private readonly repository: IOperatorsRepository,
  ) {}

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<IOperator>> {
    const [result, error] = await tryCatch(this.repository.findAll(pagination));

    if (error || !result) {
      this.logger.error(`findAll - ${error?.message}`);
      throw error;
    }

    return new PaginationResponseDto(
      result.items,
      result.total,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(id: string): Promise<IOperator> {
    const [result, error] = await tryCatch(this.repository.findById(id));

    if (error) {
      this.logger.error(`findById - ${error.message}`);
      throw error;
    }

    if (!result) {
      throw new NotFoundException(`Operator with ID ${id} not found`);
    }

    return result;
  }

  async create(data: CreateOperatorDto): Promise<IOperator> {
    const [existing, existingError] = await tryCatch(
      this.repository.findByUserId(data.userId),
    );

    if (existingError) {
      this.logger.error(`create - ${existingError.message}`);
      throw existingError;
    }

    if (existing) {
      throw new ConflictException('User already has an operator profile');
    }

    const [result, error] = await tryCatch(this.repository.create(data));

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw error;
    }

    return result;
  }

  async update(id: string, data: UpdateOperatorDto): Promise<IOperator> {
    await this.findById(id);

    const [result, error] = await tryCatch(this.repository.update(id, data));

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw error;
    }

    return result;
  }

  async softDelete(id: string): Promise<IOperator> {
    await this.findById(id);

    const [result, error] = await tryCatch(this.repository.softDelete(id));

    if (error || !result) {
      this.logger.error(`softDelete - ${error?.message}`);
      throw error;
    }

    return result;
  }
}

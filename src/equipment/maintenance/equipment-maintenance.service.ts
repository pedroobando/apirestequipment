import {
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN } from './ports/equipment-maintenance.repository';
import type {
  IEquipmentMaintenanceRepository,
  DbClient,
} from './ports/equipment-maintenance.repository';
import { CreateEquipmentMaintenanceDto } from './dto/create-equipment-maintenance.dto';
import { UpdateEquipmentMaintenanceDto } from './dto/update-equipment-maintenance.dto';
import { EquipmentMaintenanceResponseDto } from './dto/equipment-maintenance-response.dto';
import { tryCatch } from 'src/common/utils/try-catch';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';
import { OperatorsService } from 'src/operators/operators.service';

@Injectable()
export class EquipmentMaintenanceService {
  private readonly logger = new Logger(EquipmentMaintenanceService.name);

  constructor(
    @Inject(EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN)
    private readonly repository: IEquipmentMaintenanceRepository,
    private readonly operatorsService: OperatorsService,
  ) {}

  async findAllByEquipmentId(
    equipmentId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<EquipmentMaintenanceResponseDto>> {
    const [result, error] = await tryCatch(
      this.repository.findAllByEquipmentId(equipmentId, pagination),
    );

    if (error || !result) {
      this.logger.error(`findAllByEquipmentId - ${error?.message}`);
      throw error;
    }

    return new PaginationResponseDto(
      result.items.map((item) => new EquipmentMaintenanceResponseDto(item)),
      result.total,
      pagination.page,
      pagination.limit,
    );
  }

  async create(
    equipmentId: string,
    data: CreateEquipmentMaintenanceDto,
  ): Promise<EquipmentMaintenanceResponseDto> {
    if (data.mechanicId) {
      await this.validateMechanic(data.mechanicId);
    }

    const [result, error] = await tryCatch(
      this.repository.create({ ...data, equipmentId }),
    );

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw error;
    }

    return new EquipmentMaintenanceResponseDto(result);
  }

  async update(
    id: string,
    data: UpdateEquipmentMaintenanceDto,
  ): Promise<EquipmentMaintenanceResponseDto> {
    if (data.mechanicId) {
      await this.validateMechanic(data.mechanicId);
    }

    const [result, error] = await tryCatch(this.repository.update(id, data));

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw error;
    }

    return new EquipmentMaintenanceResponseDto(result);
  }

  async openRecord(equipmentId: string, client?: DbClient): Promise<void> {
    const [existing, findError] = await tryCatch(
      this.repository.findOpenByEquipmentId(equipmentId),
    );

    if (findError) {
      this.logger.error(`openRecord - ${findError.message}`);
      throw findError;
    }

    if (existing) {
      return;
    }

    const [, createError] = await tryCatch(
      this.repository.create(
        { equipmentId, reason: 'Auto-opened on status change to maintenance' },
        client,
      ),
    );

    if (createError) {
      this.logger.error(`openRecord - ${createError.message}`);
      throw createError;
    }
  }

  async closeRecord(equipmentId: string, client?: DbClient): Promise<void> {
    const [existing, findError] = await tryCatch(
      this.repository.findOpenByEquipmentId(equipmentId),
    );

    if (findError) {
      this.logger.error(`closeRecord - ${findError.message}`);
      throw findError;
    }

    if (!existing) {
      return;
    }

    const [, closeError] = await tryCatch(
      this.repository.closeRecord(existing.id, client),
    );

    if (closeError) {
      this.logger.error(`closeRecord - ${closeError.message}`);
      throw closeError;
    }
  }

  async delete(id: string): Promise<EquipmentMaintenanceResponseDto> {
    const [result, error] = await tryCatch(this.repository.delete(id));

    if (error || !result) {
      this.logger.error(`delete - ${error?.message}`);
      throw error;
    }

    return new EquipmentMaintenanceResponseDto(result);
  }

  private async validateMechanic(mechanicId: string): Promise<void> {
    const [operator, error] = await tryCatch(
      this.operatorsService.findById(mechanicId),
    );

    if (error) {
      this.logger.error(`validateMechanic - ${error.message}`);
      throw error;
    }

    if (operator.role !== 'mechanic') {
      throw new UnprocessableEntityException(
        `Operator with ID ${mechanicId} is not a mechanic`,
      );
    }
  }
}

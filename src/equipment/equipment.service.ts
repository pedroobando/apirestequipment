import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EQUIPMENT_REPOSITORY_TOKEN } from './ports/equipment.repository';
import type { IEquipmentRepository } from './ports/equipment.repository';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { IEquipment } from './interfaces/equipment.interface';
import { tryCatch } from 'src/common/utils/try-catch';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';
import { EquipmentMaintenanceService } from './maintenance/equipment-maintenance.service';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    @Inject(EQUIPMENT_REPOSITORY_TOKEN)
    private readonly repository: IEquipmentRepository,
    private readonly maintenanceService: EquipmentMaintenanceService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: {
      status?: string;
      equipmentTypeId?: string;
      isActive?: boolean;
    },
  ): Promise<PaginationResponseDto<EquipmentResponseDto>> {
    const [result, error] = await tryCatch(
      this.repository.findAll(pagination, filters),
    );

    if (error || !result) {
      this.logger.error(`findAll - ${error?.message}`);
      throw error;
    }

    return new PaginationResponseDto(
      result.items.map((item) => new EquipmentResponseDto(item)),
      result.total,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(id: string): Promise<EquipmentResponseDto> {
    const [result, error] = await tryCatch(this.repository.findById(id));

    if (error) {
      this.logger.error(`findById - ${error.message}`);
      throw error;
    }

    if (!result) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    return new EquipmentResponseDto(result);
  }

  async create(data: CreateEquipmentDto): Promise<EquipmentResponseDto> {
    if (data.plate) {
      const [existing, existingError] = await tryCatch(
        this.repository.findByPlate(data.plate),
      );

      if (existingError) {
        this.logger.error(`create - ${existingError.message}`);
        throw existingError;
      }

      if (existing) {
        throw new ConflictException(
          `Equipment with plate "${data.plate}" already exists`,
        );
      }
    }

    const [result, error] = await tryCatch(this.repository.create(data));

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw error;
    }

    return new EquipmentResponseDto(result);
  }

  async update(
    id: string,
    data: UpdateEquipmentDto,
  ): Promise<EquipmentResponseDto> {
    await this.findById(id);

    if (data.plate) {
      const [existing, existingError] = await tryCatch(
        this.repository.findByPlate(data.plate),
      );

      if (existingError) {
        this.logger.error(`update - ${existingError.message}`);
        throw existingError;
      }

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Equipment with plate "${data.plate}" already exists`,
        );
      }
    }

    const [result, error] = await tryCatch(this.repository.update(id, data));

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw error;
    }

    return new EquipmentResponseDto(result);
  }

  async softDelete(id: string): Promise<EquipmentResponseDto> {
    await this.findById(id);

    const [result, error] = await tryCatch(this.repository.softDelete(id));

    if (error || !result) {
      this.logger.error(`softDelete - ${error?.message}`);
      throw error;
    }

    return new EquipmentResponseDto(result);
  }

  /**
   * Updates equipment status and automatically opens/closes maintenance records
   * when transitioning to/from 'maintenance' status.
   */
  async updateStatus(
    id: string,
    status: string,
    statusReason?: string,
  ): Promise<EquipmentResponseDto> {
    const equipment = await this.getRawById(id);
    const oldStatus = equipment.status;
    const newStatus = status;

    if (oldStatus !== 'maintenance' && newStatus === 'maintenance') {
      await this.maintenanceService.openRecord(id);
    }

    if (oldStatus === 'maintenance' && newStatus !== 'maintenance') {
      await this.maintenanceService.closeRecord(id);
    }

    return this.update(id, { status, statusReason });
  }

  async getRawById(id: string): Promise<IEquipment> {
    const [result, error] = await tryCatch(this.repository.findById(id));

    if (error) {
      this.logger.error(`getRawById - ${error.message}`);
      throw error;
    }

    if (!result) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    return result;
  }
}

import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { EQUIPMENT_TYPES_REPOSITORY_TOKEN } from './ports/equipment-types.repository';
import type { IEquipmentTypesRepository } from './ports/equipment-types.repository';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';
import { IEquipmentType } from './interfaces/equipment-type.interface';
import { tryCatch } from 'src/common/utils/try-catch';

@Injectable()
export class EquipmentTypesService {
  private readonly logger = new Logger(EquipmentTypesService.name);

  constructor(
    @Inject(EQUIPMENT_TYPES_REPOSITORY_TOKEN)
    private readonly repository: IEquipmentTypesRepository,
  ) {}

  async findAll(): Promise<IEquipmentType[]> {
    const [result, error] = await tryCatch(this.repository.findAll());

    if (error || !result) {
      this.logger.error(`findAll - ${error?.message}`);
      throw error;
    }

    return result;
  }

  async findById(id: string): Promise<IEquipmentType> {
    const [result, error] = await tryCatch(this.repository.findById(id));

    if (error) {
      this.logger.error(`findById - ${error.message}`);
      throw error;
    }

    if (!result) {
      throw new NotFoundException(`Equipment type with ID ${id} not found`);
    }

    return result;
  }

  async create(data: CreateEquipmentTypeDto): Promise<IEquipmentType> {
    const [existing, existingError] = await tryCatch(
      this.repository.findByName(data.name),
    );

    if (existingError) {
      this.logger.error(`create - ${existingError.message}`);
      throw existingError;
    }

    if (existing) {
      throw new ConflictException(
        `Equipment type "${data.name}" already exists`,
      );
    }

    const [result, error] = await tryCatch(this.repository.create(data));

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw error;
    }

    return result;
  }

  async update(
    id: string,
    data: UpdateEquipmentTypeDto,
  ): Promise<IEquipmentType> {
    await this.findById(id);

    if (data.name) {
      const [existing, existingError] = await tryCatch(
        this.repository.findByName(data.name),
      );

      if (existingError) {
        this.logger.error(`update - ${existingError.message}`);
        throw existingError;
      }

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Equipment type "${data.name}" already exists`,
        );
      }
    }

    const [result, error] = await tryCatch(this.repository.update(id, data));

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw error;
    }

    return result;
  }

  async softDelete(id: string): Promise<IEquipmentType> {
    await this.findById(id);

    const [result, error] = await tryCatch(this.repository.softDelete(id));

    if (error || !result) {
      this.logger.error(`softDelete - ${error?.message}`);
      throw error;
    }

    return result;
  }
}

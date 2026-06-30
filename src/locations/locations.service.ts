import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LOCATIONS_REPOSITORY_TOKEN } from './ports/locations.repository';
import type { ILocationsRepository } from './ports/locations.repository';
import { CreateLocationDto } from './dto/create-location.dto';
import { RadiusQueryDto } from './dto/radius-query.dto';
import { ILocation } from './interfaces/location.interface';
import { tryCatch } from 'src/common/utils/try-catch';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @Inject(LOCATIONS_REPOSITORY_TOKEN)
    private readonly repository: ILocationsRepository,
  ) {}

  async create(data: CreateLocationDto): Promise<ILocation> {
    const [result, error] = await tryCatch(this.repository.create(data));

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw error;
    }

    return result;
  }

  async findByEquipmentId(
    equipmentId: string,
    limit?: number,
  ): Promise<ILocation[]> {
    const [result, error] = await tryCatch(
      this.repository.findByEquipmentId(equipmentId, limit ?? 50),
    );

    if (error || !result) {
      this.logger.error(`findByEquipmentId - ${error?.message}`);
      throw error;
    }

    return result;
  }

  async findWithinRadius(query: RadiusQueryDto): Promise<ILocation[]> {
    const [result, error] = await tryCatch(
      this.repository.findWithinRadius(query),
    );

    if (error || !result) {
      this.logger.error(`findWithinRadius - ${error?.message}`);
      throw error;
    }

    return result;
  }

  async getLatestByEquipmentId(equipmentId: string): Promise<ILocation> {
    const [result, error] = await tryCatch(
      this.repository.getLatestByEquipmentId(equipmentId),
    );

    if (error) {
      this.logger.error(`getLatestByEquipmentId - ${error.message}`);
      throw error;
    }

    if (!result) {
      throw new NotFoundException(
        `Location for equipment ${equipmentId} not found`,
      );
    }

    return result;
  }
}

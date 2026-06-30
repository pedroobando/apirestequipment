import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MISSIONS_REPOSITORY_TOKEN } from './ports/missions.repository';
import type { IMissionsRepository } from './ports/missions.repository';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { MissionResponseDto } from './dto/mission-response.dto';
import { IMission } from './interfaces/mission.interface';
import { tryCatch } from 'src/common/utils/try-catch';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginationResponseDto } from 'src/common/dto/pagination-response.dto';
import { MissionStatus } from 'src/common/enums/mission-status.enum';
import { EquipmentService } from 'src/equipment/equipment.service';

@Injectable()
export class MissionsService {
  private readonly logger = new Logger(MissionsService.name);

  constructor(
    @Inject(MISSIONS_REPOSITORY_TOKEN)
    private readonly repository: IMissionsRepository,
    private readonly equipmentService: EquipmentService,
  ) {}

  async findAll(
    pagination: PaginationDto,
    filters?: {
      status?: string;
      equipmentId?: string;
      operatorId?: string;
    },
  ): Promise<PaginationResponseDto<MissionResponseDto>> {
    const [result, error] = await tryCatch(
      this.repository.findAll(pagination, filters),
    );

    if (error || !result) {
      this.logger.error(`findAll - ${error?.message}`);
      throw error;
    }

    return new PaginationResponseDto(
      result.items.map((item) => new MissionResponseDto(item)),
      result.total,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(id: string): Promise<MissionResponseDto> {
    const [result, error] = await tryCatch(this.repository.findById(id));

    if (error) {
      this.logger.error(`findById - ${error.message}`);
      throw error;
    }

    if (!result) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    return new MissionResponseDto(result);
  }

  async create(data: CreateMissionDto): Promise<MissionResponseDto> {
    await this.equipmentService.getRawById(data.equipmentId);

    const [result, error] = await tryCatch(this.repository.create(data));

    if (error || !result) {
      this.logger.error(`create - ${error?.message}`);
      throw error;
    }

    return new MissionResponseDto(result);
  }

  async update(
    id: string,
    data: UpdateMissionDto,
  ): Promise<MissionResponseDto> {
    const mission = await this.findById(id);

    if (data.equipmentId && data.equipmentId !== mission.equipmentId) {
      await this.equipmentService.getRawById(data.equipmentId);
    }

    const [result, error] = await tryCatch(this.repository.update(id, data));

    if (error || !result) {
      this.logger.error(`update - ${error?.message}`);
      throw error;
    }

    return new MissionResponseDto(result);
  }

  async updateStatus(
    id: string,
    status: string,
    reason?: string,
  ): Promise<MissionResponseDto> {
    const mission = await this.findById(id);

    if (
      mission.status === MissionStatus.Completed.valueOf() ||
      mission.status === MissionStatus.Cancelled.valueOf()
    ) {
      throw new BadRequestException(
        `Cannot change status of a ${mission.status} mission`,
      );
    }

    const updateData: UpdateMissionDto = { status };

    if (status === MissionStatus.InProgress.valueOf()) {
      updateData.startedAt = new Date();
    }

    if (status === MissionStatus.Completed.valueOf()) {
      updateData.completedAt = new Date();
    }

    const [result, error] = await tryCatch(
      this.repository.update(id, updateData),
    );

    if (error || !result) {
      this.logger.error(`updateStatus - ${error?.message}`);
      throw error;
    }

    if (reason) {
      this.logger.log(`Mission ${id} status changed to ${status}: ${reason}`);
    }

    return new MissionResponseDto(result);
  }

  async softDelete(id: string): Promise<MissionResponseDto> {
    await this.findById(id);

    const [result, error] = await tryCatch(this.repository.softDelete(id));

    if (error || !result) {
      this.logger.error(`softDelete - ${error?.message}`);
      throw error;
    }

    return new MissionResponseDto(result);
  }

  async getRawById(id: string): Promise<IMission> {
    const [result, error] = await tryCatch(this.repository.findById(id));

    if (error) {
      this.logger.error(`getRawById - ${error.message}`);
      throw error;
    }

    if (!result) {
      throw new NotFoundException(`Mission with ID ${id} not found`);
    }

    return result;
  }
}

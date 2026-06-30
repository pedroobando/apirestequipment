import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MISSIONS_REPOSITORY_TOKEN } from './ports/missions.repository';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { IMission } from './interfaces/mission.interface';
import { MissionStatus } from 'src/common/enums/mission-status.enum';
import { EquipmentService } from 'src/equipment/equipment.service';
import { EQUIPMENT_REPOSITORY_TOKEN } from 'src/equipment/ports/equipment.repository';

const mockMission: IMission = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userIdCreator: '123e4567-e89b-12d3-a456-426614174002',
  equipmentId: '123e4567-e89b-12d3-a456-426614174001',
  operatorId: null,
  title: 'Rescue mission',
  description: 'Emergency transport',
  origin: 'Caracas',
  destination: 'Valencia',
  status: MissionStatus.Pending,
  startedAt: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockEquipmentRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  findByPlate: jest.fn(),
  updateStatus: jest.fn(),
};

describe('MissionsService', () => {
  let service: MissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionsService,
        EquipmentService,
        {
          provide: MISSIONS_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: EQUIPMENT_REPOSITORY_TOKEN,
          useValue: mockEquipmentRepository,
        },
      ],
    }).compile();

    service = module.get<MissionsService>(MissionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated missions', async () => {
      mockRepository.findAll.mockResolvedValue({
        items: [mockMission],
        total: 1,
      });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([
        expect.objectContaining({ id: mockMission.id }),
      ]);
      expect(result.total).toBe(1);
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('findAll db error');
      mockRepository.findAll.mockRejectedValue(dbError);

      await expect(service.findAll({ page: 1, limit: 20 })).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('findById', () => {
    it('should return mission', async () => {
      mockRepository.findById.mockResolvedValue(mockMission);

      const result = await service.findById(mockMission.id);

      expect(result.id).toBe(mockMission.id);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById(mockMission.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('findById db error');
      mockRepository.findById.mockRejectedValue(dbError);

      await expect(service.findById(mockMission.id)).rejects.toThrow(dbError);
    });
  });

  describe('create', () => {
    it('should create mission', async () => {
      mockEquipmentRepository.findById.mockResolvedValue({
        id: mockMission.equipmentId,
      });
      mockRepository.create.mockResolvedValue(mockMission);

      const dto: CreateMissionDto = {
        userIdCreator: mockMission.userIdCreator,
        equipmentId: mockMission.equipmentId,
        title: mockMission.title,
      };

      const result = await service.create(dto);

      expect(result.id).toBe(mockMission.id);
    });

    it('should propagate equipment lookup errors', async () => {
      const dbError = new Error('equipment not found');
      mockEquipmentRepository.findById.mockRejectedValue(dbError);

      const dto: CreateMissionDto = {
        userIdCreator: mockMission.userIdCreator,
        equipmentId: mockMission.equipmentId,
        title: mockMission.title,
      };

      await expect(service.create(dto)).rejects.toThrow(dbError);
    });

    it('should propagate create errors', async () => {
      mockEquipmentRepository.findById.mockResolvedValue({
        id: mockMission.equipmentId,
      });
      mockRepository.create.mockRejectedValue(new Error('create db error'));

      const dto: CreateMissionDto = {
        userIdCreator: mockMission.userIdCreator,
        equipmentId: mockMission.equipmentId,
        title: mockMission.title,
      };

      await expect(service.create(dto)).rejects.toThrow('create db error');
    });
  });

  describe('update', () => {
    it('should update mission', async () => {
      mockRepository.findById.mockResolvedValue(mockMission);
      mockRepository.update.mockResolvedValue({
        ...mockMission,
        title: 'Updated title',
      });

      const dto: UpdateMissionDto = { title: 'Updated title' };

      const result = await service.update(mockMission.id, dto);

      expect(result.title).toBe('Updated title');
    });

    it('should validate new equipmentId', async () => {
      mockRepository.findById.mockResolvedValue(mockMission);
      mockEquipmentRepository.findById.mockResolvedValue({
        id: 'new-equipment-id',
      });
      mockRepository.update.mockResolvedValue({
        ...mockMission,
        equipmentId: 'new-equipment-id',
      });

      const result = await service.update(mockMission.id, {
        equipmentId: 'new-equipment-id',
      });

      expect(result.equipmentId).toBe('new-equipment-id');
    });

    it('should propagate update errors', async () => {
      mockRepository.findById.mockResolvedValue(mockMission);
      mockRepository.update.mockRejectedValue(new Error('update db error'));

      await expect(
        service.update(mockMission.id, { title: 'x' }),
      ).rejects.toThrow('update db error');
    });
  });

  describe('updateStatus', () => {
    it('should start mission', async () => {
      mockRepository.findById.mockResolvedValue(mockMission);
      mockRepository.update.mockResolvedValue({
        ...mockMission,
        status: MissionStatus.InProgress,
        startedAt: new Date(),
      });

      const result = await service.updateStatus(
        mockMission.id,
        MissionStatus.InProgress,
      );

      expect(result.status).toBe(MissionStatus.InProgress);
    });

    it('should complete mission', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockMission,
        status: MissionStatus.InProgress,
      });
      mockRepository.update.mockResolvedValue({
        ...mockMission,
        status: MissionStatus.Completed,
        completedAt: new Date(),
      });

      const result = await service.updateStatus(
        mockMission.id,
        MissionStatus.Completed,
      );

      expect(result.status).toBe(MissionStatus.Completed);
    });

    it('should reject status change for completed mission', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockMission,
        status: MissionStatus.Completed,
      });

      await expect(
        service.updateStatus(mockMission.id, MissionStatus.InProgress),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject status change for cancelled mission', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockMission,
        status: MissionStatus.Cancelled,
      });

      await expect(
        service.updateStatus(mockMission.id, MissionStatus.InProgress),
      ).rejects.toThrow(BadRequestException);
    });

    it('should propagate updateStatus errors', async () => {
      mockRepository.findById.mockResolvedValue(mockMission);
      mockRepository.update.mockRejectedValue(
        new Error('updateStatus db error'),
      );

      await expect(
        service.updateStatus(mockMission.id, MissionStatus.InProgress),
      ).rejects.toThrow('updateStatus db error');
    });
  });

  describe('softDelete', () => {
    it('should soft delete mission', async () => {
      mockRepository.findById.mockResolvedValue(mockMission);
      mockRepository.softDelete.mockResolvedValue(mockMission);

      const result = await service.softDelete(mockMission.id);

      expect(result.id).toBe(mockMission.id);
    });

    it('should propagate softDelete errors', async () => {
      mockRepository.findById.mockResolvedValue(mockMission);
      mockRepository.softDelete.mockRejectedValue(
        new Error('softDelete db error'),
      );

      await expect(service.softDelete(mockMission.id)).rejects.toThrow(
        'softDelete db error',
      );
    });
  });
});

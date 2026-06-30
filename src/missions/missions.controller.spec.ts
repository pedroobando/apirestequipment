import { Test, TestingModule } from '@nestjs/testing';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { MissionStatus } from 'src/common/enums/mission-status.enum';
import { IMission } from './interfaces/mission.interface';

const mockMission: IMission = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userIdCreator: '123e4567-e89b-12d3-a456-426614174005',
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

const mockService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  softDelete: jest.fn(),
};

describe('MissionsController', () => {
  let controller: MissionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MissionsController],
      providers: [
        {
          provide: MissionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MissionsController>(MissionsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated missions', async () => {
      mockService.findAll.mockResolvedValue({
        data: [mockMission],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await controller.findAll(
        { page: 1, limit: 10 },
        MissionStatus.Pending,
        mockMission.equipmentId,
        'operator-uuid',
      );

      expect(result.data).toHaveLength(1);
      expect(mockService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {
          status: MissionStatus.Pending,
          equipmentId: mockMission.equipmentId,
          operatorId: 'operator-uuid',
        },
      );
    });
  });

  describe('findById', () => {
    it('should return mission by id', async () => {
      mockService.findById.mockResolvedValue(mockMission);

      const result = await controller.findById(mockMission.id);

      expect(result.id).toBe(mockMission.id);
    });
  });

  describe('create', () => {
    it('should create mission', async () => {
      const dto = {
        userIdCreator: mockMission.userIdCreator,
        equipmentId: mockMission.equipmentId,
        title: mockMission.title,
      };
      mockService.create.mockResolvedValue(mockMission);

      const result = await controller.create(dto);

      expect(result.title).toBe(mockMission.title);
    });
  });

  describe('update', () => {
    it('should update mission', async () => {
      mockService.update.mockResolvedValue(mockMission);

      const result = await controller.update(mockMission.id, {
        title: 'Updated title',
      });

      expect(result.id).toBe(mockMission.id);
    });
  });

  describe('updateStatus', () => {
    it('should update mission status', async () => {
      mockService.updateStatus.mockResolvedValue(mockMission);

      const result = await controller.updateStatus(mockMission.id, {
        status: MissionStatus.InProgress,
        reason: 'Started',
      });

      expect(result.id).toBe(mockMission.id);
    });
  });

  describe('softDelete', () => {
    it('should soft delete mission', async () => {
      mockService.softDelete.mockResolvedValue(mockMission);

      const result = await controller.softDelete(mockMission.id);

      expect(result.id).toBe(mockMission.id);
    });
  });
});

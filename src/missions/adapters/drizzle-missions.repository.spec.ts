import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleMissionsRepository } from './drizzle-missions.repository';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { IMission } from '../interfaces/mission.interface';

const mockMission: IMission = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userIdCreator: '123e4567-e89b-12d3-a456-426614174002',
  equipmentId: '123e4567-e89b-12d3-a456-426614174001',
  operatorId: null,
  title: 'Rescue mission',
  description: 'Emergency transport',
  origin: 'Caracas',
  destination: 'Valencia',
  status: 'pending',
  startedAt: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockDb = () => ({
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mockMission]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
});

describe('DrizzleMissionsRepository', () => {
  let repository: DrizzleMissionsRepository;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleMissionsRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<DrizzleMissionsRepository>(
      DrizzleMissionsRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated missions', async () => {
      const itemsQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([mockMission]),
            }),
          }),
        }),
      };
      const countQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(itemsQuery)
        .mockReturnValueOnce(countQuery);

      const result = await repository.findAll({ page: 1, limit: 20 });

      expect(result.items).toEqual([mockMission]);
      expect(result.total).toBe(1);
    });

    it('should return paginated missions with status filter', async () => {
      const itemsQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([mockMission]),
            }),
          }),
        }),
      };
      const countQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      };

      mockDb.select
        .mockReturnValueOnce(itemsQuery)
        .mockReturnValueOnce(countQuery);

      const result = await repository.findAll(
        { page: 1, limit: 20 },
        { status: 'pending' },
      );

      expect(result.items).toEqual([mockMission]);
    });
  });

  describe('findById', () => {
    it('should return mission', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockMission]),
          }),
        }),
      });

      const result = await repository.findById(mockMission.id);

      expect(result?.id).toBe(mockMission.id);
    });
  });

  describe('create', () => {
    it('should create mission', async () => {
      const result = await repository.create({
        userIdCreator: mockMission.userIdCreator,
        equipmentId: mockMission.equipmentId,
        title: mockMission.title,
      });

      expect(result.equipmentId).toBe(mockMission.equipmentId);
    });
  });

  describe('update', () => {
    it('should update mission', async () => {
      const result = await repository.update(mockMission.id, {
        title: 'Updated title',
      });

      expect(result.id).toBe(mockMission.id);
    });
  });

  describe('softDelete', () => {
    it('should delete mission', async () => {
      const result = await repository.softDelete(mockMission.id);

      expect(result.id).toBe(mockMission.id);
    });
  });
});

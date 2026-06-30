import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleLocationsRepository } from './drizzle-locations.repository';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { ILocation } from '../interfaces/location.interface';

const mockLocation: ILocation = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  equipmentId: '123e4567-e89b-12d3-a456-426614174001',
  latitude: '10.1230000',
  longitude: '-66.4560000',
  accuracy: 5,
  source: 'gps',
  recordedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockDb = () => ({
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mockLocation]),
});

describe('DrizzleLocationsRepository', () => {
  let repository: DrizzleLocationsRepository;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleLocationsRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<DrizzleLocationsRepository>(
      DrizzleLocationsRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a location', async () => {
      const result = await repository.create({
        equipmentId: mockLocation.equipmentId,
        latitude: 10.123,
        longitude: -66.456,
      });

      expect(result.equipmentId).toBe(mockLocation.equipmentId);
    });
  });

  describe('findByEquipmentId', () => {
    it('should return location history', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockLocation]),
            }),
          }),
        }),
      });

      const result = await repository.findByEquipmentId(
        mockLocation.equipmentId,
        10,
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('findWithinRadius', () => {
    it('should return locations within radius', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockLocation]),
          }),
        }),
      });

      const result = await repository.findWithinRadius({
        latitude: 10.123,
        longitude: -66.456,
        radiusKm: 5,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('getLatestByEquipmentId', () => {
    it('should return latest location', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockLocation]),
            }),
          }),
        }),
      });

      const result = await repository.getLatestByEquipmentId(
        mockLocation.equipmentId,
      );

      expect(result?.equipmentId).toBe(mockLocation.equipmentId);
    });
  });
});

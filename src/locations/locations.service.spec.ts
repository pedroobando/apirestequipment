import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LOCATIONS_REPOSITORY_TOKEN } from './ports/locations.repository';
import { CreateLocationDto } from './dto/create-location.dto';
import { RadiusQueryDto } from './dto/radius-query.dto';
import { ILocation } from './interfaces/location.interface';

const mockLocation: ILocation = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  equipmentId: '123e4567-e89b-12d3-a456-426614174001',
  latitude: '10.123',
  longitude: '-66.456',
  accuracy: 5,
  source: 'gps',
  recordedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  create: jest.fn(),
  findByEquipmentId: jest.fn(),
  findWithinRadius: jest.fn(),
  getLatestByEquipmentId: jest.fn(),
};

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: LOCATIONS_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a location', async () => {
      mockRepository.create.mockResolvedValue(mockLocation);

      const dto: CreateLocationDto = {
        equipmentId: mockLocation.equipmentId,
        latitude: 10.123,
        longitude: -66.456,
      };

      const result = await service.create(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(result.equipmentId).toBe(mockLocation.equipmentId);
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('create db error');
      mockRepository.create.mockRejectedValue(dbError);

      const dto: CreateLocationDto = {
        equipmentId: mockLocation.equipmentId,
        latitude: 10.123,
        longitude: -66.456,
      };

      await expect(service.create(dto)).rejects.toThrow(dbError);
    });
  });

  describe('findByEquipmentId', () => {
    it('should return location history with default limit', async () => {
      mockRepository.findByEquipmentId.mockResolvedValue([mockLocation]);

      const result = await service.findByEquipmentId(mockLocation.equipmentId);

      expect(mockRepository.findByEquipmentId).toHaveBeenCalledWith(
        mockLocation.equipmentId,
        50,
      );
      expect(result).toEqual([mockLocation]);
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('findByEquipmentId db error');
      mockRepository.findByEquipmentId.mockRejectedValue(dbError);

      await expect(
        service.findByEquipmentId(mockLocation.equipmentId),
      ).rejects.toThrow(dbError);
    });
  });

  describe('findWithinRadius', () => {
    it('should return locations within radius', async () => {
      mockRepository.findWithinRadius.mockResolvedValue([mockLocation]);

      const query: RadiusQueryDto = {
        latitude: 10.123,
        longitude: -66.456,
        radiusKm: 5,
        limit: 50,
      };

      const result = await service.findWithinRadius(query);

      expect(result).toEqual([mockLocation]);
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('findWithinRadius db error');
      mockRepository.findWithinRadius.mockRejectedValue(dbError);

      await expect(
        service.findWithinRadius({
          latitude: 10.123,
          longitude: -66.456,
          radiusKm: 5,
        }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('getLatestByEquipmentId', () => {
    it('should return latest location', async () => {
      mockRepository.getLatestByEquipmentId.mockResolvedValue(mockLocation);

      const result = await service.getLatestByEquipmentId(
        mockLocation.equipmentId,
      );

      expect(result.equipmentId).toBe(mockLocation.equipmentId);
    });

    it('should throw NotFoundException when no location exists', async () => {
      mockRepository.getLatestByEquipmentId.mockResolvedValue(null);

      await expect(
        service.getLatestByEquipmentId(mockLocation.equipmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('getLatest db error');
      mockRepository.getLatestByEquipmentId.mockRejectedValue(dbError);

      await expect(
        service.getLatestByEquipmentId(mockLocation.equipmentId),
      ).rejects.toThrow(dbError);
    });
  });
});

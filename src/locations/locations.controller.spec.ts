import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { ILocation } from './interfaces/location.interface';

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

const mockService = {
  findByEquipmentId: jest.fn(),
  getLatestByEquipmentId: jest.fn(),
  create: jest.fn(),
  findWithinRadius: jest.fn(),
};

describe('LocationsController', () => {
  let controller: LocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findByEquipmentId', () => {
    it('should return locations with default limit', async () => {
      mockService.findByEquipmentId.mockResolvedValue([mockLocation]);

      const result = await controller.findByEquipmentId(
        mockLocation.equipmentId,
      );

      expect(result).toHaveLength(1);
      expect(mockService.findByEquipmentId).toHaveBeenCalledWith(
        mockLocation.equipmentId,
        undefined,
      );
    });

    it('should return locations with parsed limit', async () => {
      mockService.findByEquipmentId.mockResolvedValue([mockLocation]);

      await controller.findByEquipmentId(mockLocation.equipmentId, '10');

      expect(mockService.findByEquipmentId).toHaveBeenCalledWith(
        mockLocation.equipmentId,
        10,
      );
    });
  });

  describe('getLatest', () => {
    it('should return latest location', async () => {
      mockService.getLatestByEquipmentId.mockResolvedValue(mockLocation);

      const result = await controller.getLatest(mockLocation.equipmentId);

      expect(result.id).toBe(mockLocation.id);
    });
  });

  describe('create', () => {
    it('should create location', async () => {
      const dto = { latitude: 10.123, longitude: -66.456, source: 'gps' };
      mockService.create.mockResolvedValue(mockLocation);

      const result = await controller.create(mockLocation.equipmentId, dto);

      expect(result.equipmentId).toBe(mockLocation.equipmentId);
      expect(mockService.create).toHaveBeenCalledWith({
        ...dto,
        equipmentId: mockLocation.equipmentId,
      });
    });
  });

  describe('findWithinRadius', () => {
    it('should return locations within radius', async () => {
      mockService.findWithinRadius.mockResolvedValue([mockLocation]);

      const result = await controller.findWithinRadius({
        latitude: 10.123,
        longitude: -66.456,
        radiusKm: 5,
      });

      expect(result).toHaveLength(1);
    });
  });
});

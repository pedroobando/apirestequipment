import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EQUIPMENT_REPOSITORY_TOKEN } from './ports/equipment.repository';
import { EquipmentMaintenanceService } from './maintenance/equipment-maintenance.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { IEquipment } from './interfaces/equipment.interface';

const mockEquipment: IEquipment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  ownerId: '123e4567-e89b-12d3-a456-426614174001',
  equipmentTypeId: '123e4567-e89b-12d3-a456-426614174002',
  brand: 'Toyota',
  model: 'Hilux',
  year: 2020,
  plate: 'ABC-123',
  serialNumber: 'SN123456',
  fuelType: 'gasoline',
  capacity: '1 ton',
  status: 'available',
  statusReason: null,
  origin: null,
  destination: null,
  currentLocationId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByPlate: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockMaintenanceService = {
  openRecord: jest.fn(),
  closeRecord: jest.fn(),
};

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: EQUIPMENT_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: EquipmentMaintenanceService,
          useValue: mockMaintenanceService,
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated equipment', async () => {
      mockRepository.findAll.mockResolvedValue({
        items: [mockEquipment],
        total: 1,
      });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual([
        expect.objectContaining({ id: mockEquipment.id }),
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
    it('should return equipment', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);

      const result = await service.findById(mockEquipment.id);

      expect(result.id).toBe(mockEquipment.id);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById(mockEquipment.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('findById db error');
      mockRepository.findById.mockRejectedValue(dbError);

      await expect(service.findById(mockEquipment.id)).rejects.toThrow(dbError);
    });
  });

  describe('create', () => {
    it('should create equipment', async () => {
      mockRepository.findByPlate.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockEquipment);

      const dto: CreateEquipmentDto = {
        ownerId: mockEquipment.ownerId,
        equipmentTypeId: mockEquipment.equipmentTypeId,
        plate: mockEquipment.plate,
      };

      const result = await service.create(dto);

      expect(result.id).toBe(mockEquipment.id);
    });

    it('should throw ConflictException when plate already exists', async () => {
      mockRepository.findByPlate.mockResolvedValue(mockEquipment);

      const dto: CreateEquipmentDto = {
        ownerId: mockEquipment.ownerId,
        equipmentTypeId: mockEquipment.equipmentTypeId,
        plate: mockEquipment.plate,
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should propagate findByPlate errors', async () => {
      const dbError = new Error('findByPlate db error');
      mockRepository.findByPlate.mockRejectedValue(dbError);

      const dto: CreateEquipmentDto = {
        ownerId: mockEquipment.ownerId,
        equipmentTypeId: mockEquipment.equipmentTypeId,
        plate: mockEquipment.plate,
      };

      await expect(service.create(dto)).rejects.toThrow(dbError);
    });

    it('should propagate create errors', async () => {
      mockRepository.findByPlate.mockResolvedValue(null);
      mockRepository.create.mockRejectedValue(new Error('create db error'));

      const dto: CreateEquipmentDto = {
        ownerId: mockEquipment.ownerId,
        equipmentTypeId: mockEquipment.equipmentTypeId,
        plate: mockEquipment.plate,
      };

      await expect(service.create(dto)).rejects.toThrow('create db error');
    });
  });

  describe('update', () => {
    it('should update equipment', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);
      mockRepository.findByPlate.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({
        ...mockEquipment,
        brand: 'Ford',
      });

      const dto: UpdateEquipmentDto = { brand: 'Ford' };

      const result = await service.update(mockEquipment.id, dto);

      expect(result.brand).toBe('Ford');
    });

    it('should throw ConflictException when plate belongs to other equipment', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);
      mockRepository.findByPlate.mockResolvedValue({
        ...mockEquipment,
        id: 'another-id',
      });

      const dto: UpdateEquipmentDto = { plate: 'XYZ-999' };

      await expect(service.update(mockEquipment.id, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should propagate findByPlate errors', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);
      mockRepository.findByPlate.mockRejectedValue(
        new Error('findByPlate db error'),
      );

      const dto: UpdateEquipmentDto = { plate: 'XYZ-999' };

      await expect(service.update(mockEquipment.id, dto)).rejects.toThrow(
        'findByPlate db error',
      );
    });

    it('should propagate update errors', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);
      mockRepository.findByPlate.mockResolvedValue(null);
      mockRepository.update.mockRejectedValue(new Error('update db error'));

      const dto: UpdateEquipmentDto = { brand: 'Ford' };

      await expect(service.update(mockEquipment.id, dto)).rejects.toThrow(
        'update db error',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update equipment status', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);
      mockRepository.findByPlate.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({
        ...mockEquipment,
        status: 'in_use',
        statusReason: 'Mission started',
      });

      const result = await service.updateStatus(
        mockEquipment.id,
        'in_use',
        'Mission started',
      );

      expect(result.status).toBe('in_use');
      expect(result.statusReason).toBe('Mission started');
      expect(mockMaintenanceService.openRecord).not.toHaveBeenCalled();
      expect(mockMaintenanceService.closeRecord).not.toHaveBeenCalled();
    });

    it('should auto-open maintenance record when transitioning to maintenance', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);
      mockRepository.findByPlate.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({
        ...mockEquipment,
        status: 'maintenance',
        statusReason: 'Scheduled maintenance',
      });

      const result = await service.updateStatus(
        mockEquipment.id,
        'maintenance',
        'Scheduled maintenance',
      );

      expect(result.status).toBe('maintenance');
      expect(mockMaintenanceService.openRecord).toHaveBeenCalledWith(
        mockEquipment.id,
      );
      expect(mockMaintenanceService.closeRecord).not.toHaveBeenCalled();
    });

    it('should auto-close maintenance record when leaving maintenance', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockEquipment,
        status: 'maintenance',
      });
      mockRepository.findByPlate.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({
        ...mockEquipment,
        status: 'available',
        statusReason: 'Maintenance completed',
      });

      const result = await service.updateStatus(
        mockEquipment.id,
        'available',
        'Maintenance completed',
      );

      expect(result.status).toBe('available');
      expect(mockMaintenanceService.closeRecord).toHaveBeenCalledWith(
        mockEquipment.id,
      );
      expect(mockMaintenanceService.openRecord).not.toHaveBeenCalled();
    });

    it('should not duplicate open records when already in maintenance', async () => {
      mockRepository.findById.mockResolvedValue({
        ...mockEquipment,
        status: 'maintenance',
      });
      mockRepository.findByPlate.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({
        ...mockEquipment,
        status: 'maintenance',
        statusReason: 'Still in maintenance',
      });

      const result = await service.updateStatus(
        mockEquipment.id,
        'maintenance',
        'Still in maintenance',
      );

      expect(result.status).toBe('maintenance');
      expect(mockMaintenanceService.openRecord).not.toHaveBeenCalled();
      expect(mockMaintenanceService.closeRecord).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should soft delete equipment', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);
      mockRepository.softDelete.mockResolvedValue({
        ...mockEquipment,
        isActive: false,
      });

      const result = await service.softDelete(mockEquipment.id);

      expect(result.isActive).toBe(false);
    });

    it('should propagate softDelete errors', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);
      mockRepository.softDelete.mockRejectedValue(
        new Error('softDelete db error'),
      );

      await expect(service.softDelete(mockEquipment.id)).rejects.toThrow(
        'softDelete db error',
      );
    });
  });

  describe('getRawById', () => {
    it('should return raw equipment', async () => {
      mockRepository.findById.mockResolvedValue(mockEquipment);

      const result = await service.getRawById(mockEquipment.id);

      expect(result.id).toBe(mockEquipment.id);
    });

    it('should propagate repository errors', async () => {
      const dbError = new Error('getRawById db error');
      mockRepository.findById.mockRejectedValue(dbError);

      await expect(service.getRawById(mockEquipment.id)).rejects.toThrow(
        dbError,
      );
    });
  });
});

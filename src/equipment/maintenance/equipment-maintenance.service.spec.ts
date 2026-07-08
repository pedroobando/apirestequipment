import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { EquipmentMaintenanceService } from './equipment-maintenance.service';
import { EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN } from './ports/equipment-maintenance.repository';
import { OperatorsService } from 'src/operators/operators.service';
import { IEquipmentMaintenance } from './interfaces/equipment-maintenance.interface';

const mockMaintenance: IEquipmentMaintenance = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  equipmentId: '123e4567-e89b-12d3-a456-426614174001',
  mechanicId: '123e4567-e89b-12d3-a456-426614174002',
  notes: 'Cambio de aceite',
  reason: 'Mantenimiento programado',
  cost: 15000,
  startedAt: new Date(),
  endedAt: null,
  closedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockMechanic = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  userId: '123e4567-e89b-12d3-a456-426614174003',
  licenseNumber: 'LIC-123',
  phone: '+584141234567',
  role: 'mechanic',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDriver = {
  id: '123e4567-e89b-12d3-a456-426614174004',
  userId: '123e4567-e89b-12d3-a456-426614174005',
  licenseNumber: 'LIC-456',
  phone: '+584142345678',
  role: 'driver',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findAllByEquipmentId: jest.fn(),
  findOpenByEquipmentId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  closeRecord: jest.fn(),
};

const mockOperatorsService = {
  findById: jest.fn(),
};

describe('EquipmentMaintenanceService', () => {
  let service: EquipmentMaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentMaintenanceService,
        {
          provide: EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: OperatorsService,
          useValue: mockOperatorsService,
        },
      ],
    }).compile();

    service = module.get<EquipmentMaintenanceService>(
      EquipmentMaintenanceService,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByEquipmentId', () => {
    it('should return paginated maintenance records', async () => {
      mockRepository.findAllByEquipmentId.mockResolvedValue({
        items: [mockMaintenance],
        total: 1,
      });

      const result = await service.findAllByEquipmentId(
        mockMaintenance.equipmentId,
        { page: 1, limit: 20 },
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Database failure');
      mockRepository.findAllByEquipmentId.mockRejectedValue(error);

      await expect(
        service.findAllByEquipmentId(mockMaintenance.equipmentId, {
          page: 1,
          limit: 20,
        }),
      ).rejects.toThrow(error);
    });
  });

  describe('create', () => {
    it('should create a maintenance record with a mechanic', async () => {
      mockOperatorsService.findById.mockResolvedValue(mockMechanic);
      mockRepository.create.mockResolvedValue(mockMaintenance);

      const result = await service.create(mockMaintenance.equipmentId, {
        mechanicId: mockMechanic.id,
        notes: 'Cambio de aceite',
      });

      expect(result.mechanicId).toBe(mockMechanic.id);
      expect(mockOperatorsService.findById).toHaveBeenCalledWith(
        mockMechanic.id,
      );
    });

    it('should reject a non-mechanic operator', async () => {
      mockOperatorsService.findById.mockResolvedValue(mockDriver);

      await expect(
        service.create(mockMaintenance.equipmentId, {
          mechanicId: mockDriver.id,
          notes: 'Cambio de aceite',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should allow creation without mechanicId', async () => {
      mockRepository.create.mockResolvedValue({
        ...mockMaintenance,
        mechanicId: null,
      });

      const result = await service.create(mockMaintenance.equipmentId, {
        notes: 'Cambio de aceite',
      });

      expect(result.mechanicId).toBeNull();
      expect(mockOperatorsService.findById).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a maintenance record', async () => {
      mockOperatorsService.findById.mockResolvedValue(mockMechanic);
      mockRepository.update.mockResolvedValue({
        ...mockMaintenance,
        notes: 'Updated notes',
      });

      const result = await service.update(mockMaintenance.id, {
        mechanicId: mockMechanic.id,
        notes: 'Updated notes',
      });

      expect(result.notes).toBe('Updated notes');
    });

    it('should reject a non-mechanic operator on update', async () => {
      mockOperatorsService.findById.mockResolvedValue(mockDriver);

      await expect(
        service.update(mockMaintenance.id, {
          mechanicId: mockDriver.id,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('openRecord', () => {
    it('should create an open record when none exists', async () => {
      mockRepository.findOpenByEquipmentId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockMaintenance);

      await service.openRecord(mockMaintenance.equipmentId);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ equipmentId: mockMaintenance.equipmentId }),
        undefined,
      );
    });

    it('should be idempotent when an open record already exists', async () => {
      mockRepository.findOpenByEquipmentId.mockResolvedValue(mockMaintenance);

      await service.openRecord(mockMaintenance.equipmentId);

      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('closeRecord', () => {
    it('should close the open record', async () => {
      mockRepository.findOpenByEquipmentId.mockResolvedValue(mockMaintenance);
      mockRepository.closeRecord.mockResolvedValue({
        ...mockMaintenance,
        closedAt: new Date(),
      });

      await service.closeRecord(mockMaintenance.equipmentId);

      expect(mockRepository.closeRecord).toHaveBeenCalledWith(
        mockMaintenance.id,
        undefined,
      );
    });

    it('should do nothing when no open record exists', async () => {
      mockRepository.findOpenByEquipmentId.mockResolvedValue(null);

      await service.closeRecord(mockMaintenance.equipmentId);

      expect(mockRepository.closeRecord).not.toHaveBeenCalled();
    });
  });
});

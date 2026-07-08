import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentMaintenanceController } from './equipment-maintenance.controller';
import { EquipmentMaintenanceService } from './equipment-maintenance.service';
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

const mockService = {
  findAllByEquipmentId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('EquipmentMaintenanceController', () => {
  let controller: EquipmentMaintenanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentMaintenanceController],
      providers: [
        {
          provide: EquipmentMaintenanceService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EquipmentMaintenanceController>(
      EquipmentMaintenanceController,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated maintenance records', async () => {
      mockService.findAllByEquipmentId.mockResolvedValue({
        data: [mockMaintenance],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await controller.findAll(
        mockMaintenance.equipmentId,
        '1',
        '20',
      );

      expect(result.data).toHaveLength(1);
      expect(mockService.findAllByEquipmentId).toHaveBeenCalledWith(
        mockMaintenance.equipmentId,
        { page: 1, limit: 20 },
      );
    });

    it('should use default pagination when query params are missing', async () => {
      mockService.findAllByEquipmentId.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      await controller.findAll(mockMaintenance.equipmentId);

      expect(mockService.findAllByEquipmentId).toHaveBeenCalledWith(
        mockMaintenance.equipmentId,
        { page: 1, limit: 20 },
      );
    });
  });

  describe('create', () => {
    it('should create a maintenance record', async () => {
      mockService.create.mockResolvedValue(mockMaintenance);

      const result = await controller.create(mockMaintenance.equipmentId, {
        mechanicId: mockMaintenance.mechanicId ?? undefined,
        notes: 'Cambio de aceite',
      });

      expect(result.equipmentId).toBe(mockMaintenance.equipmentId);
      expect(mockService.create).toHaveBeenCalledWith(
        mockMaintenance.equipmentId,
        {
          mechanicId: mockMaintenance.mechanicId ?? undefined,
          notes: 'Cambio de aceite',
        },
      );
    });
  });

  describe('update', () => {
    it('should update a maintenance record', async () => {
      mockService.update.mockResolvedValue({
        ...mockMaintenance,
        notes: 'Updated',
      });

      const result = await controller.update(
        mockMaintenance.equipmentId,
        mockMaintenance.id,
        { notes: 'Updated' },
      );

      expect(result.notes).toBe('Updated');
      expect(mockService.update).toHaveBeenCalledWith(mockMaintenance.id, {
        notes: 'Updated',
      });
    });
  });

  describe('delete', () => {
    it('should delete a maintenance record', async () => {
      mockService.delete.mockResolvedValue(undefined);

      const result = await controller.delete(
        mockMaintenance.equipmentId,
        mockMaintenance.id,
      );

      expect(result).toBeUndefined();
      expect(mockService.delete).toHaveBeenCalledWith(mockMaintenance.id);
    });
  });
});

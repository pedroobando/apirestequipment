import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentStatus } from 'src/common/enums/equipment-status.enum';
import { IEquipment } from './interfaces/equipment.interface';

const mockEquipment: IEquipment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  ownerId: '123e4567-e89b-12d3-a456-426614174001',
  operatorId: null,
  equipmentTypeId: '123e4567-e89b-12d3-a456-426614174002',
  currentLocationId: null,
  brand: 'Toyota',
  model: 'Hilux',
  year: 2020,
  plate: 'ABC123',
  serialNumber: 'SN123',
  fuelType: 'gasoline',
  capacity: '1 ton',
  status: EquipmentStatus.Available,
  statusReason: null,
  origin: null,
  destination: null,
  isActive: true,
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

describe('EquipmentController', () => {
  let controller: EquipmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        {
          provide: EquipmentService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated equipment', async () => {
      mockService.findAll.mockResolvedValue({
        data: [mockEquipment],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await controller.findAll(
        { page: 1, limit: 10 },
        EquipmentStatus.Available,
        mockEquipment.equipmentTypeId,
        'true',
      );

      expect(result.data).toHaveLength(1);
      expect(mockService.findAll).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {
          status: EquipmentStatus.Available,
          equipmentTypeId: mockEquipment.equipmentTypeId,
          isActive: true,
        },
      );
    });
  });

  describe('findById', () => {
    it('should return equipment by id', async () => {
      mockService.findById.mockResolvedValue(mockEquipment);

      const result = await controller.findById(mockEquipment.id);

      expect(result.id).toBe(mockEquipment.id);
    });
  });

  describe('create', () => {
    it('should create equipment', async () => {
      const dto = {
        ownerId: mockEquipment.ownerId,
        equipmentTypeId: mockEquipment.equipmentTypeId,
        plate: mockEquipment.plate,
      };
      mockService.create.mockResolvedValue(mockEquipment);

      const result = await controller.create(dto as never);

      expect(result.plate).toBe(mockEquipment.plate);
    });
  });

  describe('update', () => {
    it('should update equipment', async () => {
      mockService.update.mockResolvedValue(mockEquipment);

      const result = await controller.update(mockEquipment.id, {
        brand: 'Ford',
      });

      expect(result.id).toBe(mockEquipment.id);
    });
  });

  describe('updateStatus', () => {
    it('should update equipment status', async () => {
      mockService.updateStatus.mockResolvedValue(mockEquipment);

      const result = await controller.updateStatus(mockEquipment.id, {
        status: EquipmentStatus.OutOfService,
        statusReason: 'Scheduled service',
      });

      expect(result.id).toBe(mockEquipment.id);
    });
  });

  describe('softDelete', () => {
    it('should soft delete equipment', async () => {
      mockService.softDelete.mockResolvedValue(mockEquipment);

      const result = await controller.softDelete(mockEquipment.id);

      expect(result.id).toBe(mockEquipment.id);
    });
  });
});

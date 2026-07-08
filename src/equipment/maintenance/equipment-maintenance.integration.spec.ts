import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from '../equipment.service';
import { EquipmentMaintenanceService } from './equipment-maintenance.service';
import { EQUIPMENT_REPOSITORY_TOKEN } from '../ports/equipment.repository';
import { EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN } from './ports/equipment-maintenance.repository';
import { OperatorsService } from '../../operators/operators.service';
import { IEquipment } from '../interfaces/equipment.interface';

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
  findById: jest.fn(),
  findByPlate: jest.fn(),
  update: jest.fn(),
};

const mockMaintenanceRepository = {
  findOpenByEquipmentId: jest.fn(),
  create: jest.fn(),
  closeRecord: jest.fn(),
};

const mockOperatorsService = {
  findById: jest.fn(),
};

describe('Equipment Status to Maintenance Integration', () => {
  let equipmentService: EquipmentService;
  let maintenanceService: EquipmentMaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        EquipmentMaintenanceService,
        {
          provide: EQUIPMENT_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN,
          useValue: mockMaintenanceRepository,
        },
        {
          provide: OperatorsService,
          useValue: mockOperatorsService,
        },
      ],
    }).compile();

    equipmentService = module.get<EquipmentService>(EquipmentService);
    maintenanceService = module.get<EquipmentMaintenanceService>(
      EquipmentMaintenanceService,
    );
    jest.clearAllMocks();
  });

  it('should compile the module with services wired correctly', () => {
    expect(equipmentService).toBeDefined();
    expect(maintenanceService).toBeDefined();
  });

  it('should auto-open a maintenance record when status changes to maintenance', async () => {
    mockRepository.findById.mockResolvedValue(mockEquipment);
    mockRepository.findByPlate.mockResolvedValue(null);
    mockRepository.update.mockResolvedValue({
      ...mockEquipment,
      status: 'maintenance',
    });
    mockMaintenanceRepository.findOpenByEquipmentId.mockResolvedValue(null);
    mockMaintenanceRepository.create.mockResolvedValue({
      id: 'maint-123',
      equipmentId: mockEquipment.id,
      mechanicId: null,
      notes: null,
      reason: 'Auto-opened on status change to maintenance',
      cost: null,
      startedAt: new Date(),
      endedAt: null,
      closedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await equipmentService.updateStatus(
      mockEquipment.id,
      'maintenance',
    );

    expect(result.status).toBe('maintenance');
    expect(
      mockMaintenanceRepository.findOpenByEquipmentId,
    ).toHaveBeenCalledWith(mockEquipment.id);
    expect(mockMaintenanceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentId: mockEquipment.id,
        reason: 'Auto-opened on status change to maintenance',
      }),
      undefined,
    );
  });

  it('should auto-close the open maintenance record when leaving maintenance', async () => {
    mockRepository.findById.mockResolvedValue({
      ...mockEquipment,
      status: 'maintenance',
    });
    mockRepository.findByPlate.mockResolvedValue(null);
    mockRepository.update.mockResolvedValue({
      ...mockEquipment,
      status: 'available',
    });
    mockMaintenanceRepository.findOpenByEquipmentId.mockResolvedValue({
      id: 'maint-123',
      equipmentId: mockEquipment.id,
      mechanicId: null,
      notes: null,
      reason: 'Auto-opened on status change to maintenance',
      cost: null,
      startedAt: new Date(),
      endedAt: null,
      closedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockMaintenanceRepository.closeRecord.mockResolvedValue({
      id: 'maint-123',
      equipmentId: mockEquipment.id,
      mechanicId: null,
      notes: null,
      reason: 'Auto-opened on status change to maintenance',
      cost: null,
      startedAt: new Date(),
      endedAt: new Date(),
      closedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await equipmentService.updateStatus(
      mockEquipment.id,
      'available',
    );

    expect(result.status).toBe('available');
    expect(
      mockMaintenanceRepository.findOpenByEquipmentId,
    ).toHaveBeenCalledWith(mockEquipment.id);
    expect(mockMaintenanceRepository.closeRecord).toHaveBeenCalledWith(
      'maint-123',
      undefined,
    );
  });
});

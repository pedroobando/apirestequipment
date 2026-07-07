import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleEquipmentRepository } from './drizzle-equipment.repository';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
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

const createMockDb = () => ({
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mockEquipment]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});

describe('DrizzleEquipmentRepository', () => {
  let repository: DrizzleEquipmentRepository;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleEquipmentRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<DrizzleEquipmentRepository>(
      DrizzleEquipmentRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated equipment without filters', async () => {
      const itemsQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([mockEquipment]),
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

      expect(result.items).toEqual([mockEquipment]);
      expect(result.total).toBe(1);
    });

    it('should return paginated equipment with status filter', async () => {
      const itemsQuery = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([mockEquipment]),
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
        { status: 'available' },
      );

      expect(result.items).toEqual([mockEquipment]);
    });
  });

  describe('findById', () => {
    it('should return equipment', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEquipment]),
          }),
        }),
      });

      const result = await repository.findById(mockEquipment.id);

      expect(result?.id).toBe(mockEquipment.id);
    });
  });

  describe('findByPlate', () => {
    it('should return equipment by plate', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockEquipment]),
          }),
        }),
      });

      const result = await repository.findByPlate(mockEquipment.plate!);

      expect(result?.plate).toBe(mockEquipment.plate);
    });
  });

  describe('create', () => {
    it('should create equipment', async () => {
      const result = await repository.create({
        ownerId: mockEquipment.ownerId,
        equipmentTypeId: mockEquipment.equipmentTypeId,
      });

      expect(result.ownerId).toBe(mockEquipment.ownerId);
    });
  });

  describe('update', () => {
    it('should update equipment', async () => {
      const result = await repository.update(mockEquipment.id, {
        brand: 'Ford',
      });

      expect(result.id).toBe(mockEquipment.id);
    });
  });

  describe('softDelete', () => {
    it('should soft delete equipment', async () => {
      const result = await repository.softDelete(mockEquipment.id);

      expect(result.id).toBe(mockEquipment.id);
    });
  });
});

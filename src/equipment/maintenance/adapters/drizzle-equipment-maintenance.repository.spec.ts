/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleEquipmentMaintenanceRepository } from './drizzle-equipment-maintenance.repository';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { IEquipmentMaintenance } from '../interfaces/equipment-maintenance.interface';

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

describe('DrizzleEquipmentMaintenanceRepository', () => {
  let repository: DrizzleEquipmentMaintenanceRepository;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleEquipmentMaintenanceRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<DrizzleEquipmentMaintenanceRepository>(
      DrizzleEquipmentMaintenanceRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAllByEquipmentId', () => {
    it('should return paginated maintenance records', async () => {
      const itemsChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockMaintenance]),
      };
      const countChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 1 }]),
      };

      mockDb.select
        .mockReturnValueOnce(itemsChain)
        .mockReturnValueOnce(countChain);

      const result = await repository.findAllByEquipmentId(
        mockMaintenance.equipmentId,
        { page: 1, limit: 20 },
      );

      expect(result.items).toEqual([mockMaintenance]);
      expect(result.total).toBe(1);
    });

    it('should return empty list when no records exist', async () => {
      const itemsChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      };
      const countChain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ count: 0 }]),
      };

      mockDb.select
        .mockReturnValueOnce(itemsChain)
        .mockReturnValueOnce(countChain);

      const result = await repository.findAllByEquipmentId(
        mockMaintenance.equipmentId,
        { page: 1, limit: 20 },
      );

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOpenByEquipmentId', () => {
    it('should return the open maintenance record', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockMaintenance]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findOpenByEquipmentId(
        mockMaintenance.equipmentId,
      );

      expect(result).toEqual(mockMaintenance);
    });

    it('should return null when no open record exists', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      };
      mockDb.select.mockReturnValue(chain);

      const result = await repository.findOpenByEquipmentId(
        mockMaintenance.equipmentId,
      );

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a maintenance record', async () => {
      const chain = {
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([mockMaintenance]),
      };
      mockDb.insert.mockReturnValue(chain);

      const result = await repository.create({
        equipmentId: mockMaintenance.equipmentId,
        notes: 'Cambio de aceite',
      });

      expect(result).toEqual(mockMaintenance);
    });
  });

  describe('update', () => {
    it('should update a maintenance record', async () => {
      const chain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockResolvedValue([{ ...mockMaintenance, notes: 'Updated' }]),
      };
      mockDb.update.mockReturnValue(chain);

      const result = await repository.update(mockMaintenance.id, {
        notes: 'Updated',
      });

      expect(result.notes).toBe('Updated');
    });
  });

  describe('closeRecord', () => {
    it('should close an open maintenance record', async () => {
      const chain = {
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest
          .fn()
          .mockResolvedValue([{ ...mockMaintenance, closedAt: new Date() }]),
      };
      mockDb.update.mockReturnValue(chain);

      const result = await repository.closeRecord(mockMaintenance.id);

      expect(result.closedAt).not.toBeNull();
    });
  });
});

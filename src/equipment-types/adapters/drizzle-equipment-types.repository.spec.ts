import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DrizzleEquipmentTypesRepository } from './drizzle-equipment-types.repository';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { IEquipmentType } from '../interfaces/equipment-type.interface';

const mockType: IEquipmentType = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Ambulance',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createMockDb = () => ({
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mockType]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});

describe('DrizzleEquipmentTypesRepository', () => {
  let repository: DrizzleEquipmentTypesRepository;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleEquipmentTypesRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<DrizzleEquipmentTypesRepository>(
      DrizzleEquipmentTypesRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all equipment types', async () => {
      mockDb.from.mockReturnThis();
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([mockType]),
      });

      const result = await repository.findAll();

      expect(result).toEqual([mockType]);
    });

    it('should throw mapped error when query fails', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockRejectedValue(new Error('DB down')),
      });

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when result is null', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(null),
      });

      await expect(repository.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findById', () => {
    it('should return an equipment type', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockType]),
          }),
        }),
      });

      const result = await repository.findById(mockType.id);

      expect(result?.id).toBe(mockType.id);
    });

    it('should return null when not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findById(mockType.id);

      expect(result).toBeNull();
    });

    it('should throw mapped error when query fails', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('DB down')),
          }),
        }),
      });

      await expect(repository.findById(mockType.id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when result is null', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(repository.findById(mockType.id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('create', () => {
    it('should create an equipment type', async () => {
      const result = await repository.create({ name: 'Ambulance' });

      expect(result.name).toBe(mockType.name);
    });

    it('should throw ConflictException on duplicate key error', async () => {
      const pgError = new Error(
        'duplicate key value violates unique constraint',
      );
      (pgError as unknown as { code: string }).code = '23505';
      mockDb.values.mockReturnValue({
        returning: jest.fn().mockRejectedValue(pgError),
      });

      await expect(repository.create({ name: 'Ambulance' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException on constraint violations', async () => {
      const pgError = new Error('foreign key violation');
      (pgError as unknown as { code: string }).code = '23503';
      mockDb.values.mockReturnValue({
        returning: jest.fn().mockRejectedValue(pgError),
      });

      await expect(repository.create({ name: 'Ambulance' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on generic database error', async () => {
      mockDb.values.mockReturnValue({
        returning: jest.fn().mockRejectedValue(new Error('DB down')),
      });

      await expect(repository.create({ name: 'Ambulance' })).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when result is null', async () => {
      mockDb.values.mockReturnValue({
        returning: jest.fn().mockResolvedValue(null),
      });

      await expect(repository.create({ name: 'Ambulance' })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('update', () => {
    it('should update an equipment type', async () => {
      const result = await repository.update(mockType.id, { name: 'Truck' });

      expect(result.name).toBe(mockType.name);
    });

    it('should throw ConflictException on duplicate key error', async () => {
      const pgError = new Error(
        'duplicate key value violates unique constraint',
      );
      (pgError as unknown as { code: string }).code = '23505';
      mockDb.set.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(pgError),
        }),
      });

      await expect(
        repository.update(mockType.id, { name: 'Truck' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException on constraint violations', async () => {
      const pgError = new Error('foreign key violation');
      (pgError as unknown as { code: string }).code = '23503';
      mockDb.set.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(pgError),
        }),
      });

      await expect(
        repository.update(mockType.id, { name: 'Truck' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException on generic database error', async () => {
      mockDb.set.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('DB down')),
        }),
      });

      await expect(
        repository.update(mockType.id, { name: 'Truck' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when result is null', async () => {
      mockDb.set.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(
        repository.update(mockType.id, { name: 'Truck' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an equipment type', async () => {
      const result = await repository.softDelete(mockType.id);

      expect(result.name).toBe(mockType.name);
    });

    it('should throw InternalServerErrorException on generic database error', async () => {
      mockDb.set.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('DB down')),
        }),
      });

      await expect(repository.softDelete(mockType.id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when result is null', async () => {
      mockDb.set.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(repository.softDelete(mockType.id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

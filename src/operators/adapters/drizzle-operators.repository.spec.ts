import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleOperatorsRepository } from './drizzle-operators.repository';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { IOperator } from '../interfaces/operator.interface';

const mockOperator: IOperator = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: '123e4567-e89b-12d3-a456-426614174001',
  licenseNumber: 'LIC-123',
  phone: '+584123456789',
  role: 'driver',
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
  orderBy: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mockOperator]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});

describe('DrizzleOperatorsRepository', () => {
  let repository: DrizzleOperatorsRepository;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleOperatorsRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<DrizzleOperatorsRepository>(
      DrizzleOperatorsRepository,
    );
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated operators', async () => {
      const itemsQuery = {
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockOperator]),
          }),
        }),
      };
      const countQuery = {
        from: jest.fn().mockResolvedValue([{ count: 1 }]),
      };

      mockDb.select
        .mockReturnValueOnce(itemsQuery)
        .mockReturnValueOnce(countQuery);

      const result = await repository.findAll({ page: 1, limit: 20 });

      expect(result.items).toEqual([mockOperator]);
      expect(result.total).toBe(1);
    });

    it('should throw mapped error when items query fails', async () => {
      const itemsQuery = {
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      };
      const countQuery = {
        from: jest.fn().mockResolvedValue([{ count: 1 }]),
      };

      mockDb.select
        .mockReturnValueOnce(itemsQuery)
        .mockReturnValueOnce(countQuery);

      await expect(repository.findAll({ page: 1, limit: 20 })).rejects.toThrow(
        'Database operation failed',
      );
    });

    it('should throw mapped error when count query fails', async () => {
      const itemsQuery = {
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockOperator]),
          }),
        }),
      };
      const countQuery = {
        from: jest.fn().mockRejectedValue(new Error('DB count error')),
      };

      mockDb.select
        .mockReturnValueOnce(itemsQuery)
        .mockReturnValueOnce(countQuery);

      await expect(repository.findAll({ page: 1, limit: 20 })).rejects.toThrow(
        'Database operation failed',
      );
    });
  });

  describe('findById', () => {
    it('should return an operator', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOperator]),
          }),
        }),
      });

      const result = await repository.findById(mockOperator.id);

      expect(result?.id).toBe(mockOperator.id);
    });

    it('should throw mapped error when query fails', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      });

      await expect(repository.findById(mockOperator.id)).rejects.toThrow(
        'Database operation failed',
      );
    });
  });

  describe('findByUserId', () => {
    it('should return an operator by user id', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockOperator]),
          }),
        }),
      });

      const result = await repository.findByUserId(mockOperator.userId);

      expect(result?.userId).toBe(mockOperator.userId);
    });

    it('should throw mapped error when query fails', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('DB error')),
          }),
        }),
      });

      await expect(
        repository.findByUserId(mockOperator.userId),
      ).rejects.toThrow('Database operation failed');
    });
  });

  describe('create', () => {
    it('should create an operator', async () => {
      const result = await repository.create({
        userId: mockOperator.userId,
        licenseNumber: 'LIC-123',
      });

      expect(result.userId).toBe(mockOperator.userId);
    });

    it('should throw ConflictException on unique violation', async () => {
      const pgError = Object.assign(new Error('duplicate key value'), {
        code: '23505',
      });
      mockDb.returning.mockRejectedValueOnce(pgError);

      await expect(
        repository.create({
          userId: mockOperator.userId,
          licenseNumber: 'LIC-123',
        }),
      ).rejects.toThrow('Resource already exists');
    });

    it('should throw mapped error on generic failure', async () => {
      mockDb.returning.mockRejectedValueOnce(new Error('DB insert error'));

      await expect(
        repository.create({
          userId: mockOperator.userId,
          licenseNumber: 'LIC-123',
        }),
      ).rejects.toThrow('Database operation failed');
    });
  });

  describe('update', () => {
    it('should update an operator', async () => {
      const result = await repository.update(mockOperator.id, {
        licenseNumber: 'LIC-456',
      });

      expect(result.id).toBe(mockOperator.id);
    });

    it('should throw mapped error on unique violation', async () => {
      const pgError = Object.assign(new Error('duplicate key value'), {
        code: '23505',
      });
      mockDb.returning.mockRejectedValueOnce(pgError);

      await expect(
        repository.update(mockOperator.id, { licenseNumber: 'LIC-456' }),
      ).rejects.toThrow('Resource already exists');
    });

    it('should throw mapped error on generic failure', async () => {
      mockDb.returning.mockRejectedValueOnce(new Error('DB update error'));

      await expect(
        repository.update(mockOperator.id, { licenseNumber: 'LIC-456' }),
      ).rejects.toThrow('Database operation failed');
    });
  });

  describe('softDelete', () => {
    it('should soft delete an operator', async () => {
      const result = await repository.softDelete(mockOperator.id);

      expect(result.id).toBe(mockOperator.id);
    });

    it('should throw mapped error on foreign key violation', async () => {
      const pgError = Object.assign(new Error('foreign key violation'), {
        code: '23503',
      });
      mockDb.returning.mockRejectedValueOnce(pgError);

      await expect(repository.softDelete(mockOperator.id)).rejects.toThrow(
        'foreign key violation',
      );
    });

    it('should throw mapped error on generic failure', async () => {
      mockDb.returning.mockRejectedValueOnce(new Error('DB soft delete error'));

      await expect(repository.softDelete(mockOperator.id)).rejects.toThrow(
        'Database operation failed',
      );
    });
  });
});

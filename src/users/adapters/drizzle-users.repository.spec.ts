import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleUsersRepository } from './drizzle-users.repository';
import { DATABASE_CONNECTION } from 'src/database/database.provider';
import { IUser } from '../interfaces/user.interface';

const mockUser: IUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  passwordHash: 'hashed',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  role: 'user',
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
  returning: jest.fn().mockResolvedValue([mockUser]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
});

describe('DrizzleUsersRepository', () => {
  let repository: DrizzleUsersRepository;
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(async () => {
    mockDb = createMockDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleUsersRepository,
        {
          provide: DATABASE_CONNECTION,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<DrizzleUsersRepository>(DrizzleUsersRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 1 }]),
      });

      const result = await repository.findAll({ page: 1, limit: 20 });

      expect(result.items).toEqual([mockUser]);
      expect(result.total).toBe(1);
    });

    it('should throw when items query fails', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockRejectedValue(new Error('db error')),
          }),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockResolvedValue([{ count: 1 }]),
      });

      await expect(repository.findAll({ page: 1, limit: 20 })).rejects.toThrow(
        Error,
      );
    });

    it('should throw when count query fails', async () => {
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });
      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockRejectedValue(new Error('db error')),
      });

      await expect(repository.findAll({ page: 1, limit: 20 })).rejects.toThrow(
        Error,
      );
    });
  });

  describe('findById', () => {
    it('should return a user', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await repository.findById(mockUser.id);

      expect(result?.id).toBe(mockUser.id);
    });

    it('should throw when query fails', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('db error')),
          }),
        }),
      });

      await expect(repository.findById(mockUser.id)).rejects.toThrow(Error);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await repository.findByEmail(mockUser.email);

      expect(result?.email).toBe(mockUser.email);
    });

    it('should throw when query fails', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('db error')),
          }),
        }),
      });

      await expect(repository.findByEmail(mockUser.email)).rejects.toThrow(
        Error,
      );
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const result = await repository.create({
        email: 'test@example.com',
        password: 'hashed',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(result.email).toBe(mockUser.email);
    });

    it('should throw when query fails', async () => {
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error('db error')),
        }),
      });

      await expect(
        repository.create({
          email: 'test@example.com',
          password: 'hashed',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const result = await repository.update(mockUser.id, {
        firstName: 'Jane',
      });

      expect(result.id).toBe(mockUser.id);
    });

    it('should throw when query fails', async () => {
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('db error')),
          }),
        }),
      });

      await expect(
        repository.update(mockUser.id, { firstName: 'Jane' }),
      ).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('should soft delete a user', async () => {
      const result = await repository.remove(mockUser.id);

      expect(result.id).toBe(mockUser.id);
    });

    it('should throw when query fails', async () => {
      mockDb.update.mockReturnValueOnce({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockRejectedValue(new Error('db error')),
          }),
        }),
      });

      await expect(repository.remove(mockUser.id)).rejects.toThrow(Error);
    });
  });
});

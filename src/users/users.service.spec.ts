import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { USERS_REPOSITORY_TOKEN } from './ports/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { Role } from 'src/common/enums/role.enum';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

const mockUser: IUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  passwordHash: 'hashed',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  role: Role.User,
  provider: 'local',
  providerId: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USERS_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockRepository.findAll.mockResolvedValue({ items: [mockUser], total: 1 });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw when repository fails', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('db error'));

      await expect(service.findAll({ page: 1, limit: 20 })).rejects.toThrow(
        Error,
      );
    });
  });

  describe('findById', () => {
    it('should return a user response', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result.email).toBe(mockUser.email);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById(mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when repository fails', async () => {
      mockRepository.findById.mockRejectedValue(new Error('db error'));

      await expect(service.findById(mockUser.id)).rejects.toThrow(Error);
    });
  });

  describe('findByEmail', () => {
    it('should return a user', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result?.email).toBe(mockUser.email);
    });

    it('should return null when not found', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });

    it('should throw when repository fails', async () => {
      mockRepository.findByEmail.mockRejectedValue(new Error('db error'));

      await expect(service.findByEmail(mockUser.email)).rejects.toThrow(Error);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockUser);

      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await service.create(dto);

      expect(result.email).toBe(mockUser.email);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw when repository fails', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockRejectedValue(new Error('db error'));

      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await expect(service.create(dto)).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('should update own profile as user', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });

      const dto: UpdateUserDto = { firstName: 'Jane' };

      const result = await service.update(mockUser.id, dto, mockUser.id, false);

      expect(result.firstName).toBe('Jane');
    });

    it('should prevent non-admin from updating another user', async () => {
      await expect(
        service.update(mockUser.id, { firstName: 'Jane' }, 'other-id', false),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove role field when non-admin tries to update it', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue(mockUser);

      const dto: UpdateUserDto = {
        firstName: 'Jane',
        role: Role.Admin,
      };

      await service.update(mockUser.id, dto, mockUser.id, false);

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.not.objectContaining({ role: Role.Admin }),
      );
    });

    it('should hash password when updating', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue(mockUser);

      const dto: UpdateUserDto = { password: 'newpassword123' };

      await service.update(mockUser.id, dto, mockUser.id, false);

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ passwordHash: 'hashed' }),
      );
    });

    it('should throw when repository fails', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockRejectedValue(new Error('db error'));

      await expect(
        service.update(mockUser.id, { firstName: 'Jane' }, mockUser.id, false),
      ).rejects.toThrow(Error);
    });
  });

  describe('adminUpdate', () => {
    it('should update user as admin', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({
        ...mockUser,
        role: Role.Admin,
      });

      const result = await service.adminUpdate(mockUser.id, {
        role: Role.Admin,
      });

      expect(result.role).toBe(Role.Admin);
    });

    it('should throw when repository fails', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.update.mockRejectedValue(new Error('db error'));

      await expect(
        service.adminUpdate(mockUser.id, { firstName: 'Jane' }),
      ).rejects.toThrow(Error);
    });
  });

  describe('getById', () => {
    it('should return raw user', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getById(mockUser.id);

      expect(result.id).toBe(mockUser.id);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById(mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw when repository fails', async () => {
      mockRepository.findById.mockRejectedValue(new Error('db error'));

      await expect(service.getById(mockUser.id)).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.remove.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.remove(mockUser.id);

      expect(result.isActive).toBe(false);
    });

    it('should throw when repository fails', async () => {
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.remove.mockRejectedValue(new Error('db error'));

      await expect(service.remove(mockUser.id)).rejects.toThrow(Error);
    });
  });
});

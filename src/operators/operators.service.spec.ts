import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { OPERATORS_REPOSITORY_TOKEN } from './ports/operators.repository';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { IOperator } from './interfaces/operator.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';

const mockOperator: IOperator = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  userId: '123e4567-e89b-12d3-a456-426614174001',
  licenseNumber: 'LIC-123',
  phone: '+584141234567',
  role: 'driver',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('OperatorsService', () => {
  let service: OperatorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorsService,
        {
          provide: OPERATORS_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OperatorsService>(OperatorsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated operators', async () => {
      mockRepository.findAll.mockResolvedValue({
        items: [mockOperator],
        total: 1,
      });

      const pagination: PaginationDto = { page: 1, limit: 20 };
      const result = await service.findAll(pagination);

      expect(result.data).toEqual([mockOperator]);
      expect(result.total).toBe(1);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Database failure');
      mockRepository.findAll.mockRejectedValue(error);

      await expect(service.findAll({ page: 1, limit: 20 })).rejects.toThrow(
        error,
      );
    });
  });

  describe('findById', () => {
    it('should return an operator', async () => {
      mockRepository.findById.mockResolvedValue(mockOperator);

      const result = await service.findById(mockOperator.id);

      expect(result.id).toBe(mockOperator.id);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById(mockOperator.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Database failure');
      mockRepository.findById.mockRejectedValue(error);

      await expect(service.findById(mockOperator.id)).rejects.toThrow(error);
    });
  });

  describe('create', () => {
    it('should create a new operator', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockOperator);

      const dto: CreateOperatorDto = {
        userId: mockOperator.userId,
        licenseNumber: 'LIC-123',
      };

      const result = await service.create(dto);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(dto.userId);
      expect(result.userId).toBe(mockOperator.userId);
    });

    it('should throw ConflictException when user already has operator profile', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockOperator);

      const dto: CreateOperatorDto = {
        userId: mockOperator.userId,
      };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should propagate errors from findByUserId', async () => {
      const error = new Error('Database failure');
      mockRepository.findByUserId.mockRejectedValue(error);

      const dto: CreateOperatorDto = {
        userId: mockOperator.userId,
        licenseNumber: 'LIC-123',
      };

      await expect(service.create(dto)).rejects.toThrow(error);
    });

    it('should propagate errors from create repository call', async () => {
      mockRepository.findByUserId.mockResolvedValue(null);
      const error = new Error('Insert failure');
      mockRepository.create.mockRejectedValue(error);

      const dto: CreateOperatorDto = {
        userId: mockOperator.userId,
        licenseNumber: 'LIC-123',
      };

      await expect(service.create(dto)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('should update an operator', async () => {
      mockRepository.findById.mockResolvedValue(mockOperator);
      mockRepository.update.mockResolvedValue({
        ...mockOperator,
        licenseNumber: 'LIC-456',
      });

      const dto: UpdateOperatorDto = { licenseNumber: 'LIC-456' };

      const result = await service.update(mockOperator.id, dto);

      expect(result.licenseNumber).toBe('LIC-456');
    });

    it('should propagate errors from update repository call', async () => {
      mockRepository.findById.mockResolvedValue(mockOperator);
      const error = new Error('Update failure');
      mockRepository.update.mockRejectedValue(error);

      const dto: UpdateOperatorDto = { licenseNumber: 'LIC-456' };

      await expect(service.update(mockOperator.id, dto)).rejects.toThrow(error);
    });

    it('should throw NotFoundException when operator to update is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(mockOperator.id, { licenseNumber: 'LIC-456' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an operator', async () => {
      mockRepository.findById.mockResolvedValue(mockOperator);
      mockRepository.softDelete.mockResolvedValue({
        ...mockOperator,
        isActive: false,
      });

      const result = await service.softDelete(mockOperator.id);

      expect(result.isActive).toBe(false);
    });

    it('should propagate errors from softDelete repository call', async () => {
      mockRepository.findById.mockResolvedValue(mockOperator);
      const error = new Error('Soft delete failure');
      mockRepository.softDelete.mockRejectedValue(error);

      await expect(service.softDelete(mockOperator.id)).rejects.toThrow(error);
    });

    it('should throw NotFoundException when operator to soft delete is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.softDelete(mockOperator.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

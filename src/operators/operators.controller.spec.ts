import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { buildOperator } from 'src/common/fixtures/equipment-domain.fixtures';

const mockOperator = buildOperator({
  licenseNumber: 'LIC-123',
  phone: '+584141234567',
});

const mockService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('OperatorsController', () => {
  let controller: OperatorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OperatorsController],
      providers: [
        {
          provide: OperatorsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OperatorsController>(OperatorsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated operators', async () => {
      const pagination: PaginationDto = { page: 1, limit: 20 };
      const response = {
        data: [mockOperator],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockService.findAll.mockResolvedValue(response);

      const result = await controller.findAll(pagination);

      expect(result.data).toHaveLength(1);
      expect(mockService.findAll).toHaveBeenCalledWith(pagination);
    });
  });

  describe('findOne', () => {
    it('should return an operator by id', async () => {
      mockService.findById.mockResolvedValue(mockOperator);

      const result = await controller.findOne(mockOperator.id);

      expect(result.id).toBe(mockOperator.id);
      expect(mockService.findById).toHaveBeenCalledWith(mockOperator.id);
    });

    it('should throw NotFoundException when operator not found', async () => {
      mockService.findById.mockRejectedValue(
        new NotFoundException(`Operator with ID ${mockOperator.id} not found`),
      );

      await expect(controller.findOne(mockOperator.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockService.findById).toHaveBeenCalledWith(mockOperator.id);
    });

    it('should reject an invalid UUID parameter with BadRequestException', async () => {
      const pipe = new ParseUUIDPipe();

      await expect(
        pipe.transform('invalid-uuid', {
          type: 'param',
          metatype: String,
          data: 'id',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create an operator', async () => {
      const dto: CreateOperatorDto = {
        userId: mockOperator.userId,
        licenseNumber: 'LIC-123',
      };
      mockService.create.mockResolvedValue(mockOperator);

      const result = await controller.create(dto);

      expect(result.userId).toBe(mockOperator.userId);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException when user already has an operator profile', async () => {
      const dto: CreateOperatorDto = {
        userId: mockOperator.userId,
      };
      mockService.create.mockRejectedValue(
        new ConflictException('User already has an operator profile'),
      );

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update an operator', async () => {
      const dto: UpdateOperatorDto = { licenseNumber: 'LIC-456' };
      const updatedOperator = { ...mockOperator, licenseNumber: 'LIC-456' };
      mockService.update.mockResolvedValue(updatedOperator);

      const result = await controller.update(mockOperator.id, dto);

      expect(result.licenseNumber).toBe('LIC-456');
      expect(mockService.update).toHaveBeenCalledWith(mockOperator.id, dto);
    });
  });

  describe('remove', () => {
    it('should soft delete an operator', async () => {
      const deletedOperator = { ...mockOperator, isActive: false };
      mockService.softDelete.mockResolvedValue(deletedOperator);

      const result = await controller.remove(mockOperator.id);

      expect(result.isActive).toBe(false);
      expect(mockService.softDelete).toHaveBeenCalledWith(mockOperator.id);
    });

    it('should be restricted to admin role via Roles decorator metadata', () => {
      const reflector = new Reflector();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const handler = OperatorsController.prototype.remove;
      const requiredRoles = reflector.get<Role[] | undefined>(
        ROLES_KEY,
        handler,
      );

      expect(requiredRoles).toEqual([Role.Admin]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { EquipmentStatus } from 'src/common/enums/equipment-status.enum';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { buildEquipment } from 'src/common/fixtures/equipment-domain.fixtures';
import { IEquipment } from './interfaces/equipment.interface';

const mockEquipment: IEquipment = buildEquipment({
  id: '123e4567-e89b-12d3-a456-426614174000',
  ownerId: '123e4567-e89b-12d3-a456-426614174001',
  equipmentTypeId: '123e4567-e89b-12d3-a456-426614174002',
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
  currentLocationId: null,
  isActive: true,
});

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
      expect(mockService.findById).toHaveBeenCalledWith(mockEquipment.id);
    });

    it('should throw NotFoundException when equipment not found', async () => {
      mockService.findById.mockRejectedValue(
        new NotFoundException(`Equipment with ID ${mockEquipment.id} not found`),
      );

      await expect(controller.findById(mockEquipment.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockService.findById).toHaveBeenCalledWith(mockEquipment.id);
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
    it('should create equipment', async () => {
      const dto: CreateEquipmentDto = {
        ownerId: mockEquipment.ownerId,
        equipmentTypeId: mockEquipment.equipmentTypeId,
        plate: mockEquipment.plate,
      };
      mockService.create.mockResolvedValue(mockEquipment);

      const result = await controller.create(dto);

      expect(result.plate).toBe(mockEquipment.plate);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException when plate already exists', async () => {
      const dto: CreateEquipmentDto = {
        ownerId: mockEquipment.ownerId,
        equipmentTypeId: mockEquipment.equipmentTypeId,
        plate: mockEquipment.plate,
      };
      mockService.create.mockRejectedValue(
        new ConflictException(
          `Equipment with plate "${dto.plate}" already exists`,
        ),
      );

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
      expect(mockService.create).toHaveBeenCalledWith(dto);
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

    it('should throw NotFoundException when equipment not found', async () => {
      const dto: UpdateEquipmentDto = { brand: 'Ford' };
      mockService.update.mockRejectedValue(
        new NotFoundException(`Equipment with ID ${mockEquipment.id} not found`),
      );

      await expect(controller.update(mockEquipment.id, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockService.update).toHaveBeenCalledWith(mockEquipment.id, dto);
    });
  });

  describe('updateStatus', () => {
    it('should update equipment status', async () => {
      mockService.updateStatus.mockResolvedValue(mockEquipment);

      const dto: UpdateEquipmentStatusDto = {
        status: EquipmentStatus.OutOfService,
        statusReason: 'Scheduled service',
      };
      const result = await controller.updateStatus(mockEquipment.id, dto);

      expect(result.id).toBe(mockEquipment.id);
      expect(mockService.updateStatus).toHaveBeenCalledWith(
        mockEquipment.id,
        dto.status,
        dto.statusReason,
      );
    });

    it('should throw NotFoundException when equipment not found', async () => {
      const dto: UpdateEquipmentStatusDto = {
        status: EquipmentStatus.OutOfService,
        statusReason: 'Scheduled service',
      };
      mockService.updateStatus.mockRejectedValue(
        new NotFoundException(`Equipment with ID ${mockEquipment.id} not found`),
      );

      await expect(
        controller.updateStatus(mockEquipment.id, dto),
      ).rejects.toThrow(NotFoundException);
      expect(mockService.updateStatus).toHaveBeenCalledWith(
        mockEquipment.id,
        dto.status,
        dto.statusReason,
      );
    });

    it('should throw BadRequestException for invalid status value', async () => {
      const dto: UpdateEquipmentStatusDto = {
        status: 'invalid_status',
        statusReason: 'Invalid status',
      };
      mockService.updateStatus.mockRejectedValue(
        new BadRequestException('Invalid equipment status'),
      );

      await expect(
        controller.updateStatus(mockEquipment.id, dto),
      ).rejects.toThrow(BadRequestException);
      expect(mockService.updateStatus).toHaveBeenCalledWith(
        mockEquipment.id,
        dto.status,
        dto.statusReason,
      );
    });
  });

  describe('softDelete', () => {
    it('should soft delete equipment', async () => {
      mockService.softDelete.mockResolvedValue(mockEquipment);

      const result = await controller.softDelete(mockEquipment.id);

      expect(result.id).toBe(mockEquipment.id);
    });

    it('should throw NotFoundException when equipment not found', async () => {
      mockService.softDelete.mockRejectedValue(
        new NotFoundException(`Equipment with ID ${mockEquipment.id} not found`),
      );

      await expect(controller.softDelete(mockEquipment.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockService.softDelete).toHaveBeenCalledWith(mockEquipment.id);
    });

    it('should be restricted to admin role via Roles decorator metadata', () => {
      const reflector = new Reflector();
      const handler = EquipmentController.prototype.softDelete;
      const requiredRoles = reflector.get<Role[] | undefined>(
        ROLES_KEY,
        handler,
      );

      expect(requiredRoles).toEqual([Role.Admin]);
    });
  });
});

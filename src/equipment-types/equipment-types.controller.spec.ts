import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EquipmentTypesController } from './equipment-types.controller';
import { EquipmentTypesService } from './equipment-types.service';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';
import { buildEquipmentType } from 'src/common/fixtures/equipment-domain.fixtures';

const mockType = buildEquipmentType({ name: 'Ambulancia' });

const mockService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('EquipmentTypesController', () => {
  let controller: EquipmentTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentTypesController],
      providers: [
        {
          provide: EquipmentTypesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<EquipmentTypesController>(EquipmentTypesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an equipment type', async () => {
      const dto: CreateEquipmentTypeDto = { name: mockType.name };
      mockService.create.mockResolvedValue(mockType);

      const result = await controller.create(dto);

      expect(result.name).toBe(mockType.name);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException when name already exists', async () => {
      const dto: CreateEquipmentTypeDto = { name: mockType.name };
      mockService.create.mockRejectedValue(
        new ConflictException(
          `Equipment type "${dto.name}" already exists`,
        ),
      );

      await expect(controller.create(dto)).rejects.toThrow(ConflictException);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should update an equipment type name', async () => {
      const dto: UpdateEquipmentTypeDto = { name: 'Camioneta' };
      const updatedType = { ...mockType, name: 'Camioneta' };
      mockService.update.mockResolvedValue(updatedType);

      const result = await controller.update(mockType.id, dto);

      expect(result.name).toBe('Camioneta');
      expect(mockService.update).toHaveBeenCalledWith(mockType.id, dto);
    });

    it('should activate an equipment type', async () => {
      const dto: UpdateEquipmentTypeDto = { isActive: true };
      const updatedType = { ...mockType, isActive: true };
      mockService.update.mockResolvedValue(updatedType);

      const result = await controller.update(mockType.id, dto);

      expect(result.isActive).toBe(true);
      expect(mockService.update).toHaveBeenCalledWith(mockType.id, dto);
    });

    it('should deactivate an equipment type', async () => {
      const dto: UpdateEquipmentTypeDto = { isActive: false };
      const updatedType = { ...mockType, isActive: false };
      mockService.update.mockResolvedValue(updatedType);

      const result = await controller.update(mockType.id, dto);

      expect(result.isActive).toBe(false);
      expect(mockService.update).toHaveBeenCalledWith(mockType.id, dto);
    });

    it('should throw NotFoundException when equipment type not found', async () => {
      const dto: UpdateEquipmentTypeDto = { name: 'Camioneta' };
      mockService.update.mockRejectedValue(
        new NotFoundException(
          `Equipment type with ID ${mockType.id} not found`,
        ),
      );

      await expect(controller.update(mockType.id, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockService.update).toHaveBeenCalledWith(mockType.id, dto);
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
});

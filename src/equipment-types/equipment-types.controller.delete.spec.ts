import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EquipmentTypesController } from './equipment-types.controller';
import { EquipmentTypesService } from './equipment-types.service';
import { buildEquipmentType } from 'src/common/fixtures/equipment-domain.fixtures';

const mockType = buildEquipmentType({ name: 'Ambulancia' });

const mockService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('EquipmentTypesController - delete', () => {
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

  describe('remove', () => {
    it('should soft delete an equipment type', async () => {
      const deletedType = { ...mockType, isActive: false };
      mockService.softDelete.mockResolvedValue(deletedType);

      const result = await controller.remove(mockType.id);

      expect(result.isActive).toBe(false);
      expect(mockService.softDelete).toHaveBeenCalledWith(mockType.id);
    });

    it('should throw NotFoundException when equipment type not found', async () => {
      mockService.softDelete.mockRejectedValue(
        new NotFoundException(
          `Equipment type with ID ${mockType.id} not found`,
        ),
      );

      await expect(controller.remove(mockType.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockService.softDelete).toHaveBeenCalledWith(mockType.id);
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

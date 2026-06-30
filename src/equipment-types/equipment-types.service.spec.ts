import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EquipmentTypesService } from './equipment-types.service';
import { EQUIPMENT_TYPES_REPOSITORY_TOKEN } from './ports/equipment-types.repository';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { UpdateEquipmentTypeDto } from './dto/update-equipment-type.dto';
import { IEquipmentType } from './interfaces/equipment-type.interface';

const mockType: IEquipmentType = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Ambulance',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('EquipmentTypesService', () => {
  let service: EquipmentTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentTypesService,
        {
          provide: EQUIPMENT_TYPES_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EquipmentTypesService>(EquipmentTypesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all equipment types', async () => {
      mockRepository.findAll.mockResolvedValue([mockType]);

      const result = await service.findAll();

      expect(result).toEqual([mockType]);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    it('should propagate repository errors', async () => {
      const error = new InternalServerErrorException('Database failure');
      mockRepository.findAll.mockRejectedValue(error);

      await expect(service.findAll()).rejects.toThrow(error);
      expect(mockRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return an equipment type', async () => {
      mockRepository.findById.mockResolvedValue(mockType);

      const result = await service.findById(mockType.id);

      expect(result.id).toBe(mockType.id);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById(mockType.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate repository errors', async () => {
      const error = new InternalServerErrorException('Database failure');
      mockRepository.findById.mockRejectedValue(error);

      await expect(service.findById(mockType.id)).rejects.toThrow(error);
    });
  });

  describe('create', () => {
    it('should create a new equipment type', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockType);

      const dto: CreateEquipmentTypeDto = { name: 'Ambulance' };

      const result = await service.create(dto);

      expect(mockRepository.findByName).toHaveBeenCalledWith(dto.name);
      expect(result.name).toBe(mockType.name);
    });

    it('should throw ConflictException when name already exists', async () => {
      mockRepository.findByName.mockResolvedValue(mockType);

      const dto: CreateEquipmentTypeDto = { name: 'Ambulance' };

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should propagate errors from findByName', async () => {
      const error = new InternalServerErrorException('Database failure');
      mockRepository.findByName.mockRejectedValue(error);

      const dto: CreateEquipmentTypeDto = { name: 'Ambulance' };

      await expect(service.create(dto)).rejects.toThrow(error);
    });

    it('should propagate errors from create repository call', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      const error = new InternalServerErrorException('Insert failed');
      mockRepository.create.mockRejectedValue(error);

      const dto: CreateEquipmentTypeDto = { name: 'Ambulance' };

      await expect(service.create(dto)).rejects.toThrow(error);
    });
  });

  describe('update', () => {
    it('should update an equipment type', async () => {
      mockRepository.findById.mockResolvedValue(mockType);
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({ ...mockType, name: 'Truck' });

      const dto: UpdateEquipmentTypeDto = { name: 'Truck' };

      const result = await service.update(mockType.id, dto);

      expect(result.name).toBe('Truck');
    });

    it('should throw ConflictException when name belongs to another type', async () => {
      mockRepository.findById.mockResolvedValue(mockType);
      mockRepository.findByName.mockResolvedValue({
        ...mockType,
        id: 'another-id',
      });

      const dto: UpdateEquipmentTypeDto = { name: 'Truck' };

      await expect(service.update(mockType.id, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should propagate errors from findById', async () => {
      const error = new InternalServerErrorException('Database failure');
      mockRepository.findById.mockRejectedValue(error);

      const dto: UpdateEquipmentTypeDto = { name: 'Truck' };

      await expect(service.update(mockType.id, dto)).rejects.toThrow(error);
    });

    it('should propagate errors from findByName', async () => {
      mockRepository.findById.mockResolvedValue(mockType);
      const error = new InternalServerErrorException('Database failure');
      mockRepository.findByName.mockRejectedValue(error);

      const dto: UpdateEquipmentTypeDto = { name: 'Truck' };

      await expect(service.update(mockType.id, dto)).rejects.toThrow(error);
    });

    it('should propagate errors from update repository call', async () => {
      mockRepository.findById.mockResolvedValue(mockType);
      mockRepository.findByName.mockResolvedValue(null);
      const error = new InternalServerErrorException('Update failed');
      mockRepository.update.mockRejectedValue(error);

      const dto: UpdateEquipmentTypeDto = { name: 'Truck' };

      await expect(service.update(mockType.id, dto)).rejects.toThrow(error);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an equipment type', async () => {
      mockRepository.findById.mockResolvedValue(mockType);
      mockRepository.softDelete.mockResolvedValue({
        ...mockType,
        isActive: false,
      });

      const result = await service.softDelete(mockType.id);

      expect(result.isActive).toBe(false);
    });

    it('should propagate errors from findById', async () => {
      const error = new InternalServerErrorException('Database failure');
      mockRepository.findById.mockRejectedValue(error);

      await expect(service.softDelete(mockType.id)).rejects.toThrow(error);
    });

    it('should propagate errors from softDelete repository call', async () => {
      mockRepository.findById.mockResolvedValue(mockType);
      const error = new InternalServerErrorException('Delete failed');
      mockRepository.softDelete.mockRejectedValue(error);

      await expect(service.softDelete(mockType.id)).rejects.toThrow(error);
    });
  });
});

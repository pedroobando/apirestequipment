import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOperatorDto } from './create-operator.dto';
import { UpdateOperatorDto } from './update-operator.dto';
import { OperatorRole } from 'src/common/enums/operator-role.enum';

describe('Operators DTO Validation', () => {
  describe('CreateOperatorDto', () => {
    it('should accept a valid role (driver)', async () => {
      const dto = plainToInstance(CreateOperatorDto, {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: OperatorRole.Driver,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept a valid role (mechanic)', async () => {
      const dto = plainToInstance(CreateOperatorDto, {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: OperatorRole.Mechanic,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject an invalid role', async () => {
      const dto = plainToInstance(CreateOperatorDto, {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        role: 'invalid_role',
      });
      const errors = await validate(dto);
      const roleError = errors.find((e) => e.property === 'role');
      expect(roleError).toBeDefined();
      expect(roleError?.constraints).toHaveProperty('isEnum');
    });

    it('should accept missing optional role', async () => {
      const dto = plainToInstance(CreateOperatorDto, {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('UpdateOperatorDto', () => {
    it('should accept a valid role (driver)', async () => {
      const dto = plainToInstance(UpdateOperatorDto, {
        role: OperatorRole.Driver,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept a valid role (mechanic)', async () => {
      const dto = plainToInstance(UpdateOperatorDto, {
        role: OperatorRole.Mechanic,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject an invalid role', async () => {
      const dto = plainToInstance(UpdateOperatorDto, {
        role: 'invalid_role',
      });
      const errors = await validate(dto);
      const roleError = errors.find((e) => e.property === 'role');
      expect(roleError).toBeDefined();
      expect(roleError?.constraints).toHaveProperty('isEnum');
    });

    it('should accept missing optional role', async () => {
      const dto = plainToInstance(UpdateOperatorDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});

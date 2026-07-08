import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { OperatorRole } from 'src/common/enums/operator-role.enum';

export class UpdateOperatorDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(OperatorRole)
  role?: OperatorRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

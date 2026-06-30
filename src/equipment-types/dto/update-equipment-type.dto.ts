import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateEquipmentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateEquipmentTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

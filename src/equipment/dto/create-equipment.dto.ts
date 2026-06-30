import { IsString, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateEquipmentDto {
  @IsUUID()
  ownerId: string;

  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @IsUUID()
  equipmentTypeId: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  capacity?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  ownerId: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  equipmentTypeId: string;

  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Hilux' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2022, minimum: 1900, maximum: 2100 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiPropertyOptional({ example: 'SN123456' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'gasoline' })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({ example: '1000kg' })
  @IsOptional()
  @IsString()
  capacity?: string;

  @ApiPropertyOptional({ example: 'Caracas' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: 'Valencia' })
  @IsOptional()
  @IsString()
  destination?: string;
}

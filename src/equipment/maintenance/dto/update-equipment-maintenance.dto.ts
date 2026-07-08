import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsInt } from 'class-validator';

export class UpdateEquipmentMaintenanceDto {
  @ApiPropertyOptional({ example: 'uuid-del-mecanico' })
  @IsOptional()
  @IsUUID()
  mechanicId?: string;

  @ApiPropertyOptional({ example: 'Cambio de aceite completado' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Reparación de motor' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsInt()
  cost?: number;
}

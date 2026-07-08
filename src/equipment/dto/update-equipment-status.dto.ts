import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EquipmentStatus } from 'src/common/enums/equipment-status.enum';

export class UpdateEquipmentStatusDto {
  @ApiProperty({
    example: 'in_use',
    enum: [
      'available',
      'in_use',
      'transporting',
      'stopped_mecanic',
      'stopped_fuel',
      'stopped_driver',
      'stopped_document',
      'stopped_unauthorized',
      'out_of_service',
      'maintenance',
    ],
  })
  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;

  @ApiPropertyOptional({ example: 'Mantenimiento programado' })
  @IsOptional()
  @IsString()
  statusReason?: string;
}

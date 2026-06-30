import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

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
    ],
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Mantenimiento programado' })
  @IsOptional()
  @IsString()
  statusReason?: string;
}

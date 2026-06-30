import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateMissionStatusDto {
  @ApiProperty({
    example: 'in_progress',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
  })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'Vehículo averiado' })
  @IsOptional()
  @IsString()
  reason?: string;
}

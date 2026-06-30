import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  equipmentId: string;

  @ApiProperty({ example: 10.4806 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: -66.9036 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 5.0 })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ example: 'manual' })
  @IsOptional()
  @IsString()
  source?: string;
}

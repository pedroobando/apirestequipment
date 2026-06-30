import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateMissionDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  userIdCreator: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  equipmentId: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @ApiProperty({ example: 'Entrega de insumos medicos' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Traslado de medicamentos al hospital' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Caracas' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: 'Valencia' })
  @IsOptional()
  @IsString()
  destination?: string;
}

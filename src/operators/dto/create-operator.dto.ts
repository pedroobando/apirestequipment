import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateOperatorDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'LIC-001' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: '+584141234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'driver' })
  @IsOptional()
  @IsString()
  role?: string;
}

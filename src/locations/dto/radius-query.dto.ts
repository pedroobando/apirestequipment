import { IsNumber, IsOptional } from 'class-validator';

export class RadiusQueryDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  radiusKm: number;

  @IsOptional()
  @IsNumber()
  limit?: number = 50;
}

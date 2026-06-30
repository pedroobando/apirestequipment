import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLocationDto {
  @IsUUID()
  equipmentId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsString()
  source?: string;
}

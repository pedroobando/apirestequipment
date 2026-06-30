import { IsString, IsOptional } from 'class-validator';

export class UpdateEquipmentStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  statusReason?: string;
}

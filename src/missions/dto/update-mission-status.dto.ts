import { IsString, IsOptional } from 'class-validator';

export class UpdateMissionStatusDto {
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

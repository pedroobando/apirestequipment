import { IsString, IsOptional, IsUUID, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMissionDto {
  @IsOptional()
  @IsUUID()
  userIdCreator?: string;

  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startedAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  completedAt?: Date;
}

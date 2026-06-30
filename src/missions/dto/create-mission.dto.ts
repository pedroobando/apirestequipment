import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateMissionDto {
  @IsUUID()
  userIdCreator: string;

  @IsUUID()
  equipmentId: string;

  @IsOptional()
  @IsUUID()
  operatorId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  destination?: string;
}

import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateOperatorDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

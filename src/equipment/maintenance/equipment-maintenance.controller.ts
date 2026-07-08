import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EquipmentMaintenanceService } from './equipment-maintenance.service';
import { CreateEquipmentMaintenanceDto } from './dto/create-equipment-maintenance.dto';
import { UpdateEquipmentMaintenanceDto } from './dto/update-equipment-maintenance.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('equipment-maintenance')
@Controller('equipment')
export class EquipmentMaintenanceController {
  constructor(
    private readonly maintenanceService: EquipmentMaintenanceService,
  ) {}

  @Public()
  @Get(':id/maintenance')
  findAll(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.maintenanceService.findAllByEquipmentId(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post(':id/maintenance')
  @ApiBearerAuth()
  create(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEquipmentMaintenanceDto,
  ) {
    return this.maintenanceService.create(id, dto);
  }

  @Patch(':id/maintenance/:recordId')
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) _equipmentId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: UpdateEquipmentMaintenanceDto,
  ) {
    return this.maintenanceService.update(recordId, dto);
  }

  @Delete(':id/maintenance/:recordId')
  @ApiBearerAuth()
  delete(
    @Param('id', ParseUUIDPipe) _equipmentId: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
  ) {
    return this.maintenanceService.delete(recordId);
  }
}

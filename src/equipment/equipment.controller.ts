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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Public()
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('equipmentTypeId') equipmentTypeId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.equipmentService.findAll(pagination, {
      status,
      equipmentTypeId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Public()
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateEquipmentStatusDto,
  ) {
    return this.equipmentService.updateStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.statusReason,
    );
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiBearerAuth()
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.softDelete(id);
  }
}

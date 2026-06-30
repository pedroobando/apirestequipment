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
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { UpdateMissionStatusDto } from './dto/update-mission-status.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';

@ApiTags('missions')
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Public()
  @Get()
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('operatorId') operatorId?: string,
  ) {
    return this.missionsService.findAll(pagination, {
      status,
      equipmentId,
      operatorId,
    });
  }

  @Public()
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.missionsService.findById(id);
  }

  @Post()
  @ApiBearerAuth()
  create(@Body() createMissionDto: CreateMissionDto) {
    return this.missionsService.create(createMissionDto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMissionDto: UpdateMissionDto,
  ) {
    return this.missionsService.update(id, updateMissionDto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateMissionStatusDto,
  ) {
    return this.missionsService.updateStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.reason,
    );
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiBearerAuth()
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.missionsService.softDelete(id);
  }
}

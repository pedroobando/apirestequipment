import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { RadiusQueryDto } from './dto/radius-query.dto';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('locations')
@Controller('equipment')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Public()
  @Get(':equipmentId/locations')
  findByEquipmentId(
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findByEquipmentId(
      equipmentId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Public()
  @Get(':equipmentId/locations/latest')
  getLatest(@Param('equipmentId', ParseUUIDPipe) equipmentId: string) {
    return this.service.getLatestByEquipmentId(equipmentId);
  }

  @Post(':equipmentId/locations')
  @ApiBearerAuth()
  create(
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Body()
    dto: Omit<CreateLocationDto, 'equipmentId'> & {
      latitude: number;
      longitude: number;
    },
  ) {
    return this.service.create({ ...dto, equipmentId });
  }

  @Public()
  @Get('locations/radius')
  findWithinRadius(@Query() query: RadiusQueryDto) {
    return this.service.findWithinRadius(query);
  }
}

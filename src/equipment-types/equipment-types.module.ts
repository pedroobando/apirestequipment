import { Module } from '@nestjs/common';
import { EquipmentTypesService } from './equipment-types.service';
import { EquipmentTypesController } from './equipment-types.controller';
import { EQUIPMENT_TYPES_REPOSITORY_TOKEN } from './ports/equipment-types.repository';
import { DrizzleEquipmentTypesRepository } from './adapters/drizzle-equipment-types.repository';

@Module({
  controllers: [EquipmentTypesController],
  providers: [
    EquipmentTypesService,
    {
      provide: EQUIPMENT_TYPES_REPOSITORY_TOKEN,
      useClass: DrizzleEquipmentTypesRepository,
    },
  ],
  exports: [EquipmentTypesService],
})
export class EquipmentTypesModule {}

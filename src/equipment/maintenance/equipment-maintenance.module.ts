import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { EquipmentMaintenanceController } from './equipment-maintenance.controller';
import { EquipmentMaintenanceService } from './equipment-maintenance.service';
import { DrizzleEquipmentMaintenanceRepository } from './adapters/drizzle-equipment-maintenance.repository';
import { EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN } from './ports/equipment-maintenance.repository';
import { OperatorsModule } from 'src/operators/operators.module';

@Module({
  imports: [DatabaseModule, OperatorsModule],
  controllers: [EquipmentMaintenanceController],
  providers: [
    EquipmentMaintenanceService,
    {
      provide: EQUIPMENT_MAINTENANCE_REPOSITORY_TOKEN,
      useClass: DrizzleEquipmentMaintenanceRepository,
    },
  ],
  exports: [EquipmentMaintenanceService],
})
export class EquipmentMaintenanceModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { DrizzleEquipmentRepository } from './adapters/drizzle-equipment.repository';
import { EQUIPMENT_REPOSITORY_TOKEN } from './ports/equipment.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [EquipmentController],
  providers: [
    EquipmentService,
    {
      provide: EQUIPMENT_REPOSITORY_TOKEN,
      useClass: DrizzleEquipmentRepository,
    },
  ],
  exports: [EquipmentService],
})
export class EquipmentModule {}

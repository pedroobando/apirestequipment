import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { EquipmentModule } from 'src/equipment/equipment.module';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { DrizzleMissionsRepository } from './adapters/drizzle-missions.repository';
import { MISSIONS_REPOSITORY_TOKEN } from './ports/missions.repository';

@Module({
  imports: [DatabaseModule, EquipmentModule],
  controllers: [MissionsController],
  providers: [
    MissionsService,
    {
      provide: MISSIONS_REPOSITORY_TOKEN,
      useClass: DrizzleMissionsRepository,
    },
  ],
  exports: [MissionsService],
})
export class MissionsModule {}

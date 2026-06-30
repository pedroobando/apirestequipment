import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LOCATIONS_REPOSITORY_TOKEN } from './ports/locations.repository';
import { DrizzleLocationsRepository } from './adapters/drizzle-locations.repository';

@Module({
  controllers: [LocationsController],
  providers: [
    LocationsService,
    {
      provide: LOCATIONS_REPOSITORY_TOKEN,
      useClass: DrizzleLocationsRepository,
    },
  ],
  exports: [LocationsService],
})
export class LocationsModule {}

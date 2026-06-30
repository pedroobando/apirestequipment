import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EquipmentTypesModule } from './equipment-types/equipment-types.module';
import { OperatorsModule } from './operators/operators.module';
import { LocationsModule } from './locations/locations.module';
import { EquipmentModule } from './equipment/equipment.module';
import { MissionsModule } from './missions/missions.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    EquipmentTypesModule,
    OperatorsModule,
    LocationsModule,
    EquipmentModule,
    MissionsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

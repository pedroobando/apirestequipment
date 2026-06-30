import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { USERS_REPOSITORY_TOKEN } from './ports/users.repository';
import { DrizzleUsersRepository } from './adapters/drizzle-users.repository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY_TOKEN,
      useClass: DrizzleUsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';
import { OPERATORS_REPOSITORY_TOKEN } from './ports/operators.repository';
import { DrizzleOperatorsRepository } from './adapters/drizzle-operators.repository';

@Module({
  controllers: [OperatorsController],
  providers: [
    OperatorsService,
    {
      provide: OPERATORS_REPOSITORY_TOKEN,
      useClass: DrizzleOperatorsRepository,
    },
  ],
  exports: [OperatorsService],
})
export class OperatorsModule {}

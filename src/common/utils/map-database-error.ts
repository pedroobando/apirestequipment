import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

interface PostgresError extends Error {
  code?: string;
}

export function mapDatabaseError(error: Error | null | undefined): Error {
  if (!error) {
    return new InternalServerErrorException('Database operation failed');
  }

  const pgError = error as PostgresError;

  switch (pgError.code) {
    case '23505':
      return new ConflictException('Resource already exists');
    case '23503':
    case '23502':
    case '23514':
      return new BadRequestException(pgError.message);
    default:
      return new InternalServerErrorException('Database operation failed');
  }
}

import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { mapDatabaseError } from './map-database-error';

describe('mapDatabaseError', () => {
  it('should return InternalServerErrorException when error is null', () => {
    const result = mapDatabaseError(null);

    expect(result).toBeInstanceOf(InternalServerErrorException);
  });

  it('should return InternalServerErrorException when error is undefined', () => {
    const result = mapDatabaseError(undefined);

    expect(result).toBeInstanceOf(InternalServerErrorException);
  });

  it('should return ConflictException on unique violation (23505)', () => {
    const error = new Error('Duplicate key') as Error & { code: string };
    error.code = '23505';

    const result = mapDatabaseError(error);

    expect(result).toBeInstanceOf(ConflictException);
  });

  it('should return BadRequestException on foreign key violation (23503)', () => {
    const error = new Error('FK violation') as Error & { code: string };
    error.code = '23503';

    const result = mapDatabaseError(error);

    expect(result).toBeInstanceOf(BadRequestException);
  });

  it('should return BadRequestException on not null violation (23502)', () => {
    const error = new Error('Not null') as Error & { code: string };
    error.code = '23502';

    const result = mapDatabaseError(error);

    expect(result).toBeInstanceOf(BadRequestException);
  });

  it('should return BadRequestException on check violation (23514)', () => {
    const error = new Error('Check violation') as Error & { code: string };
    error.code = '23514';

    const result = mapDatabaseError(error);

    expect(result).toBeInstanceOf(BadRequestException);
  });

  it('should return InternalServerErrorException for unknown codes', () => {
    const error = new Error('Unknown') as Error & { code: string };
    error.code = '99999';

    const result = mapDatabaseError(error);

    expect(result).toBeInstanceOf(InternalServerErrorException);
  });
});

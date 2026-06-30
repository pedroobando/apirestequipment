import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('should validate payload and return user', () => {
    const payload = {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'user',
    };

    const result = strategy.validate(payload);

    expect(result.userId).toBe(payload.sub);
    expect(result.email).toBe(payload.email);
    expect(result.role).toBe(payload.role);
  });

  it('should throw UnauthorizedException when sub is missing', () => {
    const payload = {
      sub: '',
      email: 'test@example.com',
      role: 'user',
    };

    expect(() => strategy.validate(payload)).toThrow(UnauthorizedException);
  });
});

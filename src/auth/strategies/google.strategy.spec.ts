import { UnauthorizedException } from '@nestjs/common';
import { GoogleStrategy } from './google.strategy';
import type { Profile } from 'passport-google-oauth20';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    strategy = new GoogleStrategy();
  });

  it('should validate Google profile and return user', () => {
    const profile = {
      id: 'google-123',
      emails: [{ value: 'test@example.com' }],
      name: {
        givenName: 'John',
        familyName: 'Doe',
      },
    } as unknown as Profile;

    const result = strategy.validate('token', 'refresh', profile);

    expect(result.userId).toBe('google-123');
    expect(result.email).toBe('test@example.com');
    expect(result.role).toBe('user');
  });

  it('should throw UnauthorizedException when email is missing', () => {
    const profile = {
      id: 'google-123',
      emails: [],
      name: {
        givenName: 'John',
        familyName: 'Doe',
      },
    } as unknown as Profile;

    expect(() => strategy.validate('token', 'refresh', profile)).toThrow(
      UnauthorizedException,
    );
  });
});

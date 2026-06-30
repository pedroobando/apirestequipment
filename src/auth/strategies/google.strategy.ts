import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import type { AuthenticatedUser } from 'src/common/decorators/current-user.decorator';

export const GOOGLE_CLIENT_ID = process.env['GOOGLE_CLIENT_ID'] ?? '';
export const GOOGLE_CLIENT_SECRET = process.env['GOOGLE_CLIENT_SECRET'] ?? '';
export const GOOGLE_CALLBACK_URL =
  process.env['GOOGLE_CALLBACK_URL'] ??
  'http://localhost:3000/api/auth/google/callback';

export function isGoogleOAuthEnabled(): boolean {
  const clientId = process.env['GOOGLE_CLIENT_ID'] ?? '';
  const clientSecret = process.env['GOOGLE_CLIENT_SECRET'] ?? '';
  return clientId.trim().length > 0 && clientSecret.trim().length > 0;
}

export interface GoogleProfile {
  providerId: string;
  provider: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): AuthenticatedUser & GoogleProfile {
    const email = profile.emails?.[0]?.value;
    const providerId = profile.id;
    const firstName = profile.name?.givenName ?? '';
    const lastName = profile.name?.familyName ?? '';

    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    return {
      userId: providerId,
      email,
      role: 'user',
      provider: 'google',
      providerId,
      firstName,
      lastName,
    };
  }
}

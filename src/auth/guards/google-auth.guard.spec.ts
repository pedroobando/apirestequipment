import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';
import { AuthGuard } from '@nestjs/passport';

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleAuthGuard],
    }).compile();

    guard = module.get<GoogleAuthGuard>(GoogleAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard', () => {
    expect(guard).toBeInstanceOf(AuthGuard('google'));
  });

  it('should throw UnauthorizedException when Google OAuth is not configured', () => {
    const originalId = process.env['GOOGLE_CLIENT_ID'];
    const originalSecret = process.env['GOOGLE_CLIENT_SECRET'];
    process.env['GOOGLE_CLIENT_ID'] = '';
    process.env['GOOGLE_CLIENT_SECRET'] = '';

    const context = {
      switchToHttp: () => ({}),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);

    process.env['GOOGLE_CLIENT_ID'] = originalId;
    process.env['GOOGLE_CLIENT_SECRET'] = originalSecret;
  });
});

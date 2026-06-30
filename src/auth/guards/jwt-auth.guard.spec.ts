import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should throw UnauthorizedException when no user', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(
      UnauthorizedException,
    );
  });

  it('should return user when authenticated', () => {
    const user = { userId: '123', email: 'test@example.com', role: 'user' };

    expect(guard.handleRequest(null, user)).toBe(user);
  });

  it('should allow public routes', () => {
    class PublicController {}
    Reflect.defineMetadata(IS_PUBLIC_KEY, true, PublicController);

    const mockContext = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue(PublicController),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});

import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from 'src/common/enums/role.enum';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    const reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow when no roles are required', () => {
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when user has required role', () => {
    const handler = jest.fn();
    Reflect.defineMetadata(ROLES_KEY, [Role.Admin], handler);

    const context = {
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: '1', email: 'admin@test.com', role: Role.Admin },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks role', () => {
    const handler = jest.fn();
    Reflect.defineMetadata(ROLES_KEY, [Role.Admin], handler);

    const context = {
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: '1', email: 'user@test.com', role: Role.User },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

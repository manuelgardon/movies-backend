import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Role } from '../enums/role.enum';
import { RolesGuard } from './roles.guard';

const createMockContext = (user: { role: Role } | null) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('allows access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const result = guard.canActivate(createMockContext(null));
    expect(result).toBe(true);
  });

  it('allows access when user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const result = guard.canActivate(createMockContext({ role: Role.ADMIN }));
    expect(result).toBe(true);
  });

  it('denies access when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const result = guard.canActivate(createMockContext({ role: Role.USER }));
    expect(result).toBe(false);
  });

  it('allows access when user role matches one of multiple required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Role.ADMIN, Role.USER]);
    const result = guard.canActivate(createMockContext({ role: Role.USER }));
    expect(result).toBe(true);
  });
});

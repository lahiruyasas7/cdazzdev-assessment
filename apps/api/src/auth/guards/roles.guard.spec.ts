import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { JwtPayload } from '../types/jwt-payload.type';
import { RolesGuard } from './roles-guard';
import { GlobalRole } from '../../generated/prisma/enums';

/**
 * Unit tests for RolesGuard in isolation. Reflector is mocked so these
 * tests control exactly what @Roles() metadata is "found" on a given
 * route, without needing a real controller/handler to decorate.
 */
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  function makeContext(user: JwtPayload | undefined): ExecutionContext {
    return {
      getHandler: () => ({}) as any,
      getClass: () => ({}) as any,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows the request through when the route has no @Roles() metadata at all', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = makeContext({
      sub: 'u1',
      email: 'a@b.com',
      role: GlobalRole.MEMBER,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows the request through when @Roles() was given an empty array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = makeContext({
      sub: 'u1',
      email: 'a@b.com',
      role: GlobalRole.MEMBER,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws ForbiddenException when there's no authenticated user on the request at all", () => {
    reflector.getAllAndOverride.mockReturnValue([GlobalRole.ADMIN]);
    const context = makeContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("allows the request when the user's global role is in the required list", () => {
    reflector.getAllAndOverride.mockReturnValue([
      GlobalRole.ADMIN,
      GlobalRole.MANAGER,
    ]);
    const context = makeContext({
      sub: 'u1',
      email: 'm@b.com',
      role: GlobalRole.MANAGER,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it("rejects when the user's global role is NOT in the required list", () => {
    reflector.getAllAndOverride.mockReturnValue([
      GlobalRole.ADMIN,
      GlobalRole.MANAGER,
    ]);
    const context = makeContext({
      sub: 'u1',
      email: 'mem@b.com',
      role: GlobalRole.MEMBER,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('reads metadata from both the handler and the class, handler taking precedence (getAllAndOverride contract)', () => {
    reflector.getAllAndOverride.mockReturnValue([GlobalRole.ADMIN]);
    const context = makeContext({
      sub: 'u1',
      email: 'a@b.com',
      role: GlobalRole.ADMIN,
    });

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});

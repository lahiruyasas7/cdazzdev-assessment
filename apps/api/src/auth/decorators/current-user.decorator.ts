import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

/**
 * Usage: findAll(@CurrentUser() user: JwtPayload)
 * Pulls the JWT payload that JwtAccessGuard attached to the request,
 * instead of reaching into `@Req() req` and indexing `req.user` by hand
 * in every controller method.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

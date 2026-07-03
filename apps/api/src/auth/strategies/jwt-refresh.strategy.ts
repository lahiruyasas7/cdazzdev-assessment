import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload.type';

/**
 * Validates refresh tokens specifically. Uses a DIFFERENT secret than
 * the access-token strategy on purpose: if JWT_ACCESS_SECRET ever leaked,
 * an attacker still couldn't mint a fake refresh token (and vice versa).
 * Extracts the token from the request body (`refreshToken` field) since
 * /auth/refresh takes it as a POST body, not an Authorization header.
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }
    return payload;
  }
}

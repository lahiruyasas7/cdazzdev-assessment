import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types/jwt-payload.type';
 
/**
 * Validates the short-lived access token sent as
 * `Authorization: Bearer <token>`. This strategy does NOT hit the
 * database on every request — it trusts the signed JWT payload as-is.
 * That's a deliberate performance choice (no DB round trip per request)
 * with one real consequence: if a user's role changes mid-session, the
 * old token keeps the old role until it expires (max 15 min here).
 * Acceptable for this assessment's scope; worth a line in the README.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }
 
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    // Whatever is returned here becomes `request.user` in controllers.
    return payload;
  }
}
 
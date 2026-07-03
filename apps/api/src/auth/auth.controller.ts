import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginUserDto } from './dto/login.dto';
import {
  AuthResponseDto,
  RefreshResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.type';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a new user with the MEMBER role and immediately issues an access + refresh token pair, same as login.',
  })
  @ApiCreatedResponse({ description: 'Account created', type: AuthResponseDto })
  @ApiConflictResponse({
    description: 'An account with this email already exists',
  })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({ description: 'Login successful', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(@Body() dto: LoginUserDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({
    summary: 'Exchange a valid refresh token for a new access token',
    description:
      'The refresh token is sent in the request body (not an Authorization header). Returns only a new accessToken — the refreshToken itself stays valid until its own expiry.',
  })
  @ApiOkResponse({
    description: 'New access token issued',
    type: RefreshResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token missing, invalid, or expired',
  })
  refresh(
    @Body() _dto: RefreshTokenDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<RefreshResponseDto> {
    return this.authService.refresh(user);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get the currently authenticated user',
    description:
      'Re-fetches the user fresh from the database rather than trusting the access token payload, so a role change since the token was issued is reflected immediately.',
  })
  @ApiOkResponse({ description: 'Current user', type: UserResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired access token',
  })
  me(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.authService.getMe(user);
  }
}

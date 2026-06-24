// src/auth/dto/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { GlobalRole } from 'src/generated/prisma/enums';

export class UserResponseDto {
  @ApiProperty({ example: 'b3f1e2a0-1234-4abc-9def-1234567890ab' })
  id!: string;

  @ApiProperty({ example: 'alice@teamsync.dev' })
  email!: string;

  @ApiProperty({ example: 'Alice Johnson' })
  name!: string;

  @ApiProperty({ enum: GlobalRole, example: GlobalRole.MEMBER })
  role!: GlobalRole;

  @ApiProperty({ example: '2026-06-20T08:00:00.000Z' })
  createdAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Short-lived JWT used to authenticate requests' })
  accessToken!: string;

  @ApiProperty({
    description: 'Longer-lived token used only to obtain a new accessToken',
  })
  refreshToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'A newly issued short-lived JWT' })
  accessToken!: string;
}

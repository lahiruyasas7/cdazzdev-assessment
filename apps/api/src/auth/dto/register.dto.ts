// src/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'alice@teamsync.dev' })
  @IsNotEmpty({ message: 'email can not be empty' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'a-strong-password-123' })
  @IsString()
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters.' }) // Ensure password is between 8 and 50 characters
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter.',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter.',
  })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number.' })
  @Matches(/[@$!%*?&#]/, {
    message: 'Password must contain at least one special character (@$!%*?&#).',
  })
  password!: string;

  @ApiProperty({ example: 'Alice Johnson' })
  @IsString()
  @MinLength(1, { message: 'name is required' })
  @MaxLength(100)
  name!: string;
}

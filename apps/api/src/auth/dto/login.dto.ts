import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginUserDto {
  @ApiProperty({
    type: 'string',
    description: 'enter the user email',
    required: true,
    example: 'user6@gmail.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    type: 'string',
    description: 'enter the user password',
    required: true,
    example: 'Gh@1hjjj78',
  })
  @IsNotEmpty({ message: 'password can not be empty' })
  @IsStrongPassword()
  password!: string;
}

// src/projects/dto/create-project.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Mobile App Redesign' })
  @IsString()
  @MinLength(1, { message: 'name is required' })
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    example: 'Redesign the onboarding flow and task board for v2.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

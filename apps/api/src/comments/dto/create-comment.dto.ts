// src/comments/dto/create-comment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Pushed a fix for this — can you re-test on staging?',
  })
  @IsString()
  @MinLength(1, { message: 'body cannot be empty' })
  @MaxLength(5000, { message: 'body must be at most 5000 characters' })
  body!: string;
}

// src/comments/dto/comment-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

class CommentAuthorDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

export class CommentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() body!: string;
  @ApiProperty() taskId!: string;
  @ApiProperty({ type: CommentAuthorDto }) author!: CommentAuthorDto;
  @ApiProperty() createdAt!: Date;
}

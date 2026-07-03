// src/tasks/dto/task-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from 'src/generated/prisma/enums';

class AssigneeSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
}

export class TaskResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty({ enum: TaskStatus }) status!: TaskStatus;
  @ApiProperty({ enum: TaskPriority }) priority!: TaskPriority;
  @ApiProperty({ nullable: true }) dueDate!: Date | null;
  @ApiProperty() projectId!: string;
  @ApiProperty({ type: AssigneeSummaryDto, nullable: true })
  assignee!: AssigneeSummaryDto | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

class CommentAuthorDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

class CommentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() body!: string;
  @ApiProperty({ type: CommentAuthorDto }) author!: CommentAuthorDto;
  @ApiProperty() createdAt!: Date;
}

// GET /tasks/:id — "includes assignee and comment thread" (brief, 2.2)
export class TaskDetailResponseDto extends TaskResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  comments!: CommentResponseDto[];
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 47 }) total!: number;
  @ApiProperty({ example: 3 }) totalPages!: number;
}

export class PaginatedTasksResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data!: TaskResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

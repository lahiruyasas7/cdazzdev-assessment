// src/tasks/dto/query-tasks.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { TaskPriority, TaskStatus } from 'src/generated/prisma/enums';

export class QueryTasksDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: 'status must be one of TODO, IN_PROGRESS, DONE',
  })
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority, {
    message: 'priority must be one of LOW, MEDIUM, HIGH',
  })
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Filter by assignee user id (UUID)' })
  @IsOptional()
  @IsUUID('all', { message: 'assigneeId must be a valid UUID' })
  assigneeId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number) // query params arrive as strings; convert before validating as a number
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // hard ceiling — without this, ?limit=999999 lets a client force a full table scan
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['dueDate', 'priority'], default: 'dueDate' })
  @IsOptional()
  @IsIn(['dueDate', 'priority'], {
    message: 'sortBy must be dueDate or priority',
  })
  sortBy?: 'dueDate' | 'priority' = 'dueDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be asc or desc' })
  @Transform(({ value }) => value?.toLowerCase())
  sortOrder?: 'asc' | 'desc' = 'asc';
}

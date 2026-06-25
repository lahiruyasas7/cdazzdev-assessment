import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import {
  PaginatedTasksResponseDto,
  TaskResponseDto,
} from './dto/task-response.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { CreateTaskDto } from './dto/create-task.dto';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('projects/:id/tasks')
  @ApiOperation({
    summary: "List a project's tasks",
    description:
      'Supports filtering by status, priority, and assigneeId; pagination via page/limit; sorting by dueDate or priority. Requires project membership.',
  })
  @ApiOkResponse({ type: PaginatedTasksResponseDto })
  @ApiNotFoundResponse({
    description: 'Project not found, or you are not a member of it',
  })
  findAllForProject(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Query() query: QueryTasksDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.findAllForProject(projectId, user.sub, query);
  }

  @Post('projects/:id/tasks')
  @ApiOperation({
    summary: 'Create a task on a project',
    description:
      "Restricted to the project's manager or a global admin. (Not explicitly stated for POST in the brief — interpreted consistently with the PATCH restriction's intent, since plain creation has no 'assignee' to check against yet.)",
  })
  @ApiCreatedResponse({ type: TaskResponseDto })
  @ApiForbiddenResponse({ description: 'Not the project manager or an admin' })
  create(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.create(projectId, dto, user);
  }
}

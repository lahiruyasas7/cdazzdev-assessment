import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { PaginatedTasksResponseDto } from './dto/task-response.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';

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
}

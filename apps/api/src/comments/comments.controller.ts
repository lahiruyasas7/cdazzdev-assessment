import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';

@ApiTags('Comments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard)
@Controller('tasks/:id/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a comment to a task',
    description:
      "Open to any member (or owner) of the task's project — not restricted to the assignee/manager/admin set used for PATCH /tasks/:id.",
  })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiNotFoundResponse({
    description: 'Task not found, or you are not a member of its project',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  create(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.commentsService.create(taskId, dto, user);
  }
}

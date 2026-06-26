import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * POST /tasks/:id/comments
   
   */
  async create(taskId: string, dto: CreateCommentDto, requester: JwtPayload) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const allowed = await this.projectsService.isMemberOrOwner(
      task.projectId,
      requester.sub,
    );
    if (!allowed) {
      // existence to someone outside its project.
      throw new NotFoundException('Task not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        authorId: requester.sub,
        body: dto.body,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return comment;
  }
}

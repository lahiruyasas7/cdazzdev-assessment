import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * GET /projects/:id/tasks
   */
  async findAllForProject(
    projectId: string,
    requesterId: string,
    query: QueryTasksDto,
  ) {
    const allowed = await this.projectsService.isMemberOrOwner(
      projectId,
      requesterId,
    );
    if (!allowed) {
    
      throw new NotFoundException('Project not found');
    }

    const {
      status,
      priority,
      assigneeId,
      page = 1,
      limit = 20,
      sortBy = 'dueDate',
      sortOrder = 'asc',
    } = query;

    const where: Prisma.TaskWhereInput = {
      projectId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assigneeId && { assigneeId }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

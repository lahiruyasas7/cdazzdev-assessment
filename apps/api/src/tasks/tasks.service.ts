import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GlobalRole, Prisma, ProjectRole } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { UpdateTaskDto } from './dto/update-task.dto';

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

  /**
   * POST /projects/:id/tasks
   *
   * The brief only states the assignee/manager/admin restriction for
   * PATCH /tasks/:id, not for creation. Interpreting silently would be
   * a mistake here, so to be explicit: creating a task requires being
   * a MANAGER on this specific project, or a global ADMIN. A plain
   * MEMBER cannot create tasks on a project they merely belong to. If
   * the intent was actually "any member can create tasks," that's a
   * one-line relaxation — flagging this as an interpretation, not
   * an unstated assumption.
   */
  async create(projectId: string, dto: CreateTaskDto, requester: JwtPayload) {
    await this.assertCanManageProject(projectId, requester);

    if (dto.assigneeId) {
      await this.assertUserIsProjectMember(projectId, dto.assigneeId);
    }

    const task = await this.prisma.task.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate,
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    return task;
  }

  /**
   * GET /tasks/:id — "includes assignee and comment thread" (brief, 2.2)
   * Same membership gate as the list endpoint: you must belong to the
   * task's project to view it.
   */
  async findOne(taskId: string, requesterId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const allowed = await this.projectsService.isMemberOrOwner(
      task.projectId,
      requesterId,
    );
    if (!allowed) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  /**
   * PATCH /tasks/:id — "updates restricted to the task's assignee, the
   * project's manager, or an Admin" (brief, 2.2), implemented exactly
   * as the three explicit conditions, nothing more.
   */
  async update(taskId: string, dto: UpdateTaskDto, requester: JwtPayload) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.assertCanUpdateTask(task.projectId, task.assigneeId, requester);

    if (dto.assigneeId) {
      await this.assertUserIsProjectMember(task.projectId, dto.assigneeId);
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        ...('assigneeId' in dto && { assigneeId: dto.assigneeId }),
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    return updated;
  }

  // ── Shared authorization helpers ────────────────────────────────────

  /** ADMIN, or MANAGER on this specific project. Used to gate task creation. */
  private async assertCanManageProject(
    projectId: string,
    requester: JwtPayload,
  ) {
    if (requester.role === GlobalRole.ADMIN) return;

    const membership = await this.projectsService.getMembership(
      projectId,
      requester.sub,
    );
    if (membership?.role === ProjectRole.MANAGER) return;

    throw new ForbiddenException(
      'Only the project manager or an admin can perform this action',
    );
  }

  /**
   * The exact three-way check the brief specifies for PATCH /tasks/:id:
   * the task's current assignee, the project's manager, or a global admin.
   */
  private async assertCanUpdateTask(
    projectId: string,
    currentAssigneeId: string | null,
    requester: JwtPayload,
  ) {
    if (requester.role === GlobalRole.ADMIN) return;
    if (currentAssigneeId && currentAssigneeId === requester.sub) return;

    const membership = await this.projectsService.getMembership(
      projectId,
      requester.sub,
    );
    if (membership?.role === ProjectRole.MANAGER) return;

    throw new ForbiddenException(
      "Only the task's assignee, the project manager, or an admin can update this task",
    );
  }

  /** Prevents assigning a task to someone who isn't even on the project. */
  private async assertUserIsProjectMember(projectId: string, userId: string) {
    const allowed = await this.projectsService.isMemberOrOwner(
      projectId,
      userId,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'Cannot assign a task to a user who is not a member of this project',
      );
    }
  }
}

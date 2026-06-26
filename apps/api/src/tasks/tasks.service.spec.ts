import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma.service';
import { ProjectsService } from '../projects/projects.service';
import {
  GlobalRole,
  ProjectRole,
  TaskPriority,
  TaskStatus,
} from 'src/generated/prisma/client';
import { JwtPayload } from '../auth/types/jwt-payload.type';

/**
 * Unit tests for TasksService — PrismaService and ProjectsService are
 * both fully mocked here. This deliberately does NOT hit a real
 * database; it tests TasksService's own logic (query construction,
 * pagination math, which authorization branch fires) in isolation.
 * Integration tests against a real Postgres instance would be a
 * separate, complementary layer — out of scope for "unit tests."
 */
describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let projectsService: {
    isMemberOrOwner: jest.Mock;
    getMembership: jest.Mock;
  };

  const PROJECT_ID = 'project-1';
  const TASK_ID = 'task-1';

  const adminUser: JwtPayload = {
    sub: 'admin-1',
    email: 'admin@test.dev',
    role: GlobalRole.ADMIN,
  };
  const managerUser: JwtPayload = {
    sub: 'manager-1',
    email: 'manager@test.dev',
    role: GlobalRole.MANAGER,
  };
  const memberUser: JwtPayload = {
    sub: 'member-1',
    email: 'member@test.dev',
    role: GlobalRole.MEMBER,
  };
  const otherMemberUser: JwtPayload = {
    sub: 'other-member-1',
    email: 'other@test.dev',
    role: GlobalRole.MEMBER,
  };

  beforeEach(async () => {
    prisma = {
      task: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      // findAllForProject uses $transaction([findMany, count]) — mock it
      // to just resolve both inner calls and return their results as a
      // tuple, mirroring Prisma's real batch-transaction behavior.
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };

    projectsService = {
      isMemberOrOwner: jest.fn(),
      getMembership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectsService, useValue: projectsService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── findAllForProject: membership gate ──────────────────────────────

  describe('findAllForProject', () => {
    it('throws NotFoundException if the requester is not a project member', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(false);

      await expect(
        service.findAllForProject(PROJECT_ID, memberUser.sub, {}),
      ).rejects.toThrow(NotFoundException);

      // Should fail fast — never even attempt the task query.
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    // ── filtering ──────────────────────────────────────────────────────

    it('builds a Prisma where-clause containing only the filters that were actually provided', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(true);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAllForProject(PROJECT_ID, memberUser.sub, {
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        assigneeId: 'user-42',
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: PROJECT_ID,
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            assigneeId: 'user-42',
          },
        }),
      );
    });

    it('omits filter fields entirely when not provided, rather than passing them as undefined', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(true);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAllForProject(PROJECT_ID, memberUser.sub, {});

      const callArgs = prisma.task.findMany.mock.calls[0][0];
      expect(callArgs.where).toEqual({ projectId: PROJECT_ID });
      expect(callArgs.where).not.toHaveProperty('status');
      expect(callArgs.where).not.toHaveProperty('priority');
      expect(callArgs.where).not.toHaveProperty('assigneeId');
    });

    // ── pagination ─────────────────────────────────────────────────────

    it('defaults to page 1, limit 20 when neither is provided', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(true);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      const result = await service.findAllForProject(
        PROJECT_ID,
        memberUser.sub,
        {},
      );

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
      });
    });

    it('computes skip correctly for page > 1 (page-1 * limit)', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(true);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAllForProject(PROJECT_ID, memberUser.sub, {
        page: 3,
        limit: 10,
      });

      // Page 3 at 10/page should skip the first 20 records (pages 1 and 2).
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('computes totalPages as ceil(total / limit), with a floor of 1', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(true);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(47);

      const result = await service.findAllForProject(
        PROJECT_ID,
        memberUser.sub,
        { limit: 20 },
      );

      // 47 records at 20/page = 3 pages (20, 20, 7) — must round UP, not down.
      expect(result.meta.totalPages).toBe(3);
    });

    it('never reports totalPages as 0, even when there are zero matching tasks', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(true);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      const result = await service.findAllForProject(
        PROJECT_ID,
        memberUser.sub,
        {},
      );

      // Math.ceil(0/20) is 0, which would be a nonsensical "page 0 of 0"
      // in a UI — the floor of 1 in the implementation exists specifically
      // to prevent that.
      expect(result.meta.totalPages).toBe(1);
    });

    // ── sorting ────────────────────────────────────────────────────────

    it('sorts by dueDate ascending by default', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(true);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAllForProject(PROJECT_ID, memberUser.sub, {});

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { dueDate: 'asc' } }),
      );
    });

    it('sorts by priority descending when explicitly requested', async () => {
      projectsService.isMemberOrOwner.mockResolvedValue(true);
      prisma.task.findMany.mockResolvedValue([]);
      prisma.task.count.mockResolvedValue(0);

      await service.findAllForProject(PROJECT_ID, memberUser.sub, {
        sortBy: 'priority',
        sortOrder: 'desc',
      });

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { priority: 'desc' } }),
      );
    });
  });

  // ── create: manager-or-admin gate ───────────────────────────────────

  describe('create', () => {
    const dto = { title: 'New task' };

    it('allows a global ADMIN to create a task even with no project membership', async () => {
      projectsService.getMembership.mockResolvedValue(null);
      prisma.task.create.mockResolvedValue({
        id: TASK_ID,
        ...dto,
        projectId: PROJECT_ID,
      });

      await expect(
        service.create(PROJECT_ID, dto, adminUser),
      ).resolves.toBeDefined();
      // ADMIN short-circuits before even checking membership.
      expect(projectsService.getMembership).not.toHaveBeenCalled();
    });

    it('allows a user who is a MANAGER on this specific project', async () => {
      projectsService.getMembership.mockResolvedValue({
        role: ProjectRole.MANAGER,
      });
      prisma.task.create.mockResolvedValue({
        id: TASK_ID,
        ...dto,
        projectId: PROJECT_ID,
      });

      await expect(
        service.create(PROJECT_ID, dto, managerUser),
      ).resolves.toBeDefined();
    });

    it('rejects a plain MEMBER, even if they belong to the project', async () => {
      projectsService.getMembership.mockResolvedValue({
        role: ProjectRole.MEMBER,
      });

      await expect(service.create(PROJECT_ID, dto, memberUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('rejects a user with no membership on this project at all', async () => {
      projectsService.getMembership.mockResolvedValue(null);

      await expect(service.create(PROJECT_ID, dto, memberUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects creating a task pre-assigned to a user who is not a project member', async () => {
      projectsService.getMembership.mockResolvedValue({
        role: ProjectRole.MANAGER,
      });
      projectsService.isMemberOrOwner.mockResolvedValue(false); // assignee check

      await expect(
        service.create(
          PROJECT_ID,
          { ...dto, assigneeId: 'outsider-1' },
          managerUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });

  // ── findOne: membership gate, including the not-a-member-of-this-task's-project case ──

  describe('findOne', () => {
    it('throws NotFoundException if the task does not exist', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(TASK_ID, memberUser.sub)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if the task exists but the requester is not a project member', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: TASK_ID,
        projectId: PROJECT_ID,
      });
      projectsService.isMemberOrOwner.mockResolvedValue(false);

      await expect(
        service.findOne(TASK_ID, otherMemberUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the task, with assignee and comments, for an authorized member', async () => {
      const fullTask = {
        id: TASK_ID,
        projectId: PROJECT_ID,
        assignee: { id: 'm1', name: 'M', email: 'm@test.dev' },
        comments: [{ id: 'c1', body: 'hi', author: { id: 'm1', name: 'M' } }],
      };
      prisma.task.findUnique.mockResolvedValue(fullTask);
      projectsService.isMemberOrOwner.mockResolvedValue(true);

      const result = await service.findOne(TASK_ID, memberUser.sub);
      expect(result).toEqual(fullTask);
    });
  });

  // ── update: the exact three-way RBAC rule from the brief ───────────

  describe('update — assignee, project manager, or admin only', () => {
    const existingTask = {
      id: TASK_ID,
      projectId: PROJECT_ID,
      assigneeId: memberUser.sub,
    };

    beforeEach(() => {
      prisma.task.findUnique.mockResolvedValue(existingTask);
      prisma.task.update.mockResolvedValue({
        ...existingTask,
        status: TaskStatus.DONE,
      });
    });

    it("allows the task's current assignee to update it", async () => {
      await expect(
        service.update(TASK_ID, { status: TaskStatus.DONE }, memberUser),
      ).resolves.toBeDefined();
      // Assignee match short-circuits — no need to even look up project membership.
      expect(projectsService.getMembership).not.toHaveBeenCalled();
    });

    it('allows a global ADMIN to update any task, even if not the assignee or a project member', async () => {
      await expect(
        service.update(TASK_ID, { status: TaskStatus.DONE }, adminUser),
      ).resolves.toBeDefined();
      expect(projectsService.getMembership).not.toHaveBeenCalled();
    });

    it("allows the project's MANAGER to update a task even when they are not the assignee", async () => {
      projectsService.getMembership.mockResolvedValue({
        role: ProjectRole.MANAGER,
      });

      await expect(
        service.update(TASK_ID, { status: TaskStatus.DONE }, managerUser),
      ).resolves.toBeDefined();
    });

    it('rejects a different MEMBER who is neither the assignee, a manager, nor an admin', async () => {
      projectsService.getMembership.mockResolvedValue({
        role: ProjectRole.MEMBER,
      });

      await expect(
        service.update(TASK_ID, { status: TaskStatus.DONE }, otherMemberUser),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('rejects a MEMBER with no project membership at all', async () => {
      projectsService.getMembership.mockResolvedValue(null);

      await expect(
        service.update(TASK_ID, { status: TaskStatus.DONE }, otherMemberUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if the task being updated does not exist', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'nonexistent-task',
          { status: TaskStatus.DONE },
          adminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('treats an explicit null assigneeId as "unassign" and passes it through to the update call', async () => {
      // Requester is admin so the RBAC check passes regardless; this test
      // is specifically about the null-vs-undefined handling, not RBAC.
      await service.update(TASK_ID, { assigneeId: null }, adminUser);

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assigneeId: null }),
        }),
      );
    });

    it('does not touch assigneeId at all when the field is omitted from the update', async () => {
      await service.update(TASK_ID, { status: TaskStatus.DONE }, adminUser);

      const callArgs = prisma.task.update.mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty('assigneeId');
    });
  });
});

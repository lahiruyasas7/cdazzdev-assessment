// prisma/seed.ts
//
// Populates enough data to exercise every endpoint built so far:
// auth (login as any seeded user with the password below), project
// membership/RBAC (one ADMIN, one MANAGER, one plain MEMBER), task
// filtering/sorting/pagination (5 tasks spread across statuses,
// priorities, and assignees), and the comment thread on GET /tasks/:id.
//
// Written with upsert() throughout so this script is idempotent — running
// `npx prisma db seed` multiple times (e.g. every `docker compose up`)
// updates existing rows instead of erroring on duplicate emails or
// creating duplicate projects/tasks each time.

import {
  PrismaClient,
  GlobalRole,
  ProjectRole,
  TaskStatus,
  TaskPriority,
} from '../src/generated/prisma/client';
import type { Task } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = 'Password123!'; // same password for every seeded user, for reviewer convenience — never used for real accounts
const BCRYPT_SALT_ROUNDS = 12; // matches AuthService — keep these in sync if either changes

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_SALT_ROUNDS);

  // ── Users ──────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@teamsync.dev' },
    update: {},
    create: {
      email: 'admin@teamsync.dev',
      passwordHash,
      name: 'Ava Admin',
      role: GlobalRole.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@teamsync.dev' },
    update: {},
    create: {
      email: 'manager@teamsync.dev',
      passwordHash,
      name: 'Marcus Manager',
      role: GlobalRole.MANAGER,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@teamsync.dev' },
    update: {},
    create: {
      email: 'member@teamsync.dev',
      passwordHash,
      name: 'Mia Member',
      role: GlobalRole.MEMBER,
    },
  });

  console.log('Seeded users:', admin.email, manager.email, member.email);

  // ── Project ────────────────────────────────────────────────────────
  // Owned by the manager, since POST /projects is Manager/Admin-only —
  // this models the realistic case of who'd actually create a project.
  let project = await prisma.project.findFirst({
    where: { name: 'TeamSync Launch', ownerId: manager.id },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'TeamSync Launch',
        description: 'Internal project used to demo the TeamSync API and apps.',
        ownerId: manager.id,
      },
    });
  }

  console.log('Seeded project:', project.name);

  // ── Project memberships ───────────────────────────────────────────
  // Manager is MANAGER on their own project (mirrors ProjectsService.create
  // behavior). Member is a plain MEMBER. Admin deliberately has NO
  // membership row here — this exercises the "Admins don't see projects
  // they don't belong to" rule from GET /projects on purpose, so a
  // reviewer testing with the admin account sees that behavior for real.
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: manager.id, projectId: project.id } },
    update: {},
    create: {
      userId: manager.id,
      projectId: project.id,
      role: ProjectRole.MANAGER,
    },
  });

  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: member.id, projectId: project.id } },
    update: {},
    create: {
      userId: member.id,
      projectId: project.id,
      role: ProjectRole.MEMBER,
    },
  });

  console.log('Seeded project memberships for manager + member');

  // ── Tasks ──────────────────────────────────────────────────────────
  // Spread deliberately across status, priority, and assignee so that
  // filtering (?status=, ?priority=, ?assigneeId=), sorting (dueDate,
  // priority), and pagination all have real variation to exercise.
  const taskSeeds = [
    {
      title: 'Set up CI pipeline',
      description: 'Run lint, build, and tests on every PR.',
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      assigneeId: manager.id,
      dueDate: new Date('2026-06-10T00:00:00.000Z'),
    },
    {
      title: 'Design onboarding flow',
      description: 'Wireframe the first-run experience for new users.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeId: member.id,
      dueDate: new Date('2026-07-01T00:00:00.000Z'),
    },
    {
      title: 'Implement task filtering API',
      description: 'Support status/priority/assignee filters with pagination.',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assigneeId: manager.id,
      dueDate: new Date('2026-06-28T00:00:00.000Z'),
    },
    {
      title: 'Write Jest tests for RBAC guards',
      description: 'Cover assignee/manager/admin update permissions.',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assigneeId: member.id,
      dueDate: new Date('2026-07-05T00:00:00.000Z'),
    },
    {
      title: 'Draft launch announcement',
      description: null,
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      assigneeId: null, // deliberately unassigned — exercises the nullable assignee path
      dueDate: null, // deliberately no due date — exercises the nullable dueDate path
    },
  ];

  const createdTasks: Task[] = [];
  for (const seed of taskSeeds) {
    let task = await prisma.task.findFirst({
      where: { title: seed.title, projectId: project.id },
    });
    if (!task) {
      task = await prisma.task.create({
        data: { ...seed, projectId: project.id },
      });
    }
    createdTasks.push(task);
  }

  console.log(`Seeded ${createdTasks.length} tasks`);

  // ── Comments ───────────────────────────────────────────────────────
  // A short thread on the first task so GET /tasks/:id has real comment
  // data to display, not an empty array.
  const firstTask = createdTasks[0];
  const existingComments = await prisma.comment.count({
    where: { taskId: firstTask.id },
  });

  if (existingComments === 0) {
    await prisma.comment.create({
      data: {
        taskId: firstTask.id,
        authorId: manager.id,
        body: 'CI is green on main — closing this out.',
      },
    });
    await prisma.comment.create({
      data: {
        taskId: firstTask.id,
        authorId: member.id,
        body: 'Nice, confirmed the pipeline runs on my last PR too.',
      },
    });
    console.log('Seeded 2 comments on:', firstTask.title);
  }

  console.log('\nSeed complete. Log in with any of:');
  console.log(
    `  ${admin.email} / ${SEED_PASSWORD}  (ADMIN, no project membership)`,
  );
  console.log(
    `  ${manager.email} / ${SEED_PASSWORD}  (MANAGER, owns "TeamSync Launch")`,
  );
  console.log(
    `  ${member.email} / ${SEED_PASSWORD}  (MEMBER, on "TeamSync Launch")`,
  );
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

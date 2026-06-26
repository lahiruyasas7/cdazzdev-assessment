import { Injectable } from '@nestjs/common';
import { ProjectRole } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  //get all users
  async findAllForUser(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        members: { where: { userId }, select: { role: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => {
      const membership = project.members[0];
      const myRole: ProjectRole =
        membership?.role ??
        (project.ownerId === userId ? ProjectRole.MANAGER : ProjectRole.MEMBER);

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        myRole,
        memberCount: project._count.members,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });
  }

  //create project
  async create(dto: CreateProjectDto, ownerId: string) {
    console.log('owner id', ownerId);
    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          name: dto.name,
          description: dto.description,
          ownerId,
        },
      });

      await tx.projectMember.create({
        data: {
          projectId: created.id,
          userId: ownerId,
          role: ProjectRole.MANAGER,
        },
      });

      return created;
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      myRole: ProjectRole.MANAGER,
      memberCount: 1,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Returns the requesting user's ProjectMember row for a given project,
   * or null if they have no membership (including if the project
   * doesn't exist — callers distinguish that separately when needed).
   *
   * Exists so TasksService can answer "is this user a manager of THIS
   * project" without duplicating Prisma query logic for project
   * membership in two modules.
   */
  async getMembership(projectId: string, userId: string) {
    return this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });
  }

  /**
   * "Belongs to" check shared with findAllForUser's definition: owner OR
   * has a ProjectMember row. Used by TasksService to gate GET .../tasks
   * and POST .../tasks so non-members can't view or create tasks on a
   * project just by guessing its id.
   */
  async isMemberOrOwner(projectId: string, userId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) return false;
    if (project.ownerId === userId) return true;

    const membership = await this.getMembership(projectId, userId);
    return membership !== null;
  }
}

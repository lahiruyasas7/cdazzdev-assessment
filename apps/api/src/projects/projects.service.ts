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
}

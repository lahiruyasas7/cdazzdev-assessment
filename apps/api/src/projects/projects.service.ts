import { Injectable } from '@nestjs/common';
import { ProjectRole } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';

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
}

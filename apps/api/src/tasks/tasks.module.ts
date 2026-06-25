import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ProjectsService } from 'src/projects/projects.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, ProjectsService, PrismaService],
})
export class TasksModule {}

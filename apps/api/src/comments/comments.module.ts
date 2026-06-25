import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaService } from 'src/prisma.service';
import { ProjectsService } from 'src/projects/projects.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, PrismaService, ProjectsService],
})
export class CommentsModule {}

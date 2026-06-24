import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { RolesGuard } from 'src/auth/guards/roles-guard';
import { ProjectResponseDto } from './dto/project-responce.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GlobalRole } from 'src/generated/prisma/enums';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@UseGuards(JwtAccessGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'List projects the authenticated user belongs to',
    description:
      'Returns projects where the user is either the owner or a ProjectMember. Does not return every project in the system, even for Admins — membership is required.',
  })
  @ApiOkResponse({
    description: 'List of projects',
    type: [ProjectResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  findAll(@CurrentUser() user: JwtPayload): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAllForUser(user.sub);
  }

  // create project
  @Post()
  @Roles(GlobalRole.ADMIN, GlobalRole.MANAGER)
  @ApiOperation({
    summary: 'Create a new project',
    description:
      'Restricted to users with global role ADMIN or MANAGER. The creator becomes the project owner and is added as a MANAGER-level ProjectMember.',
  })
  @ApiCreatedResponse({
    description: 'Project created',
    type: ProjectResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @ApiForbiddenResponse({
    description: 'User does not have ADMIN or MANAGER global role',
  })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.create(dto, user.sub);
  }
}

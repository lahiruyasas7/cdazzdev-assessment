import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  ApiBearerAuth,
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
}

// src/projects/dto/project-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from 'src/generated/prisma/enums';

export class ProjectResponseDto {
  @ApiProperty({ example: 'b3f1e2a0-1234-4abc-9def-1234567890ab' })
  id!: string;

  @ApiProperty({ example: 'Mobile App Redesign' })
  name!: string;

  @ApiProperty({ example: 'Redesign the onboarding flow.', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'b3f1e2a0-aaaa-4abc-9def-1234567890ab' })
  ownerId!: string;

  @ApiProperty({
    enum: ProjectRole,
    example: ProjectRole.MANAGER,
    description:
      "The requesting user's role on THIS project specifically (not their global role).",
  })
  myRole!: ProjectRole;

  @ApiProperty({ example: 4, description: 'Number of members on this project' })
  memberCount!: number;

  @ApiProperty({ example: '2026-06-20T08:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-06-20T08:00:00.000Z' })
  updatedAt!: Date;
}

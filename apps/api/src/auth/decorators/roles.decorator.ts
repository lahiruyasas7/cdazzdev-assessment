import { SetMetadata } from '@nestjs/common';
import { GlobalRole } from 'prisma/src/generated/prisma/enums';

export const ROLES_KEY = 'roles';

/**
 * Usage: @Roles(GlobalRole.ADMIN, GlobalRole.MANAGER)
 * Attaches required-role metadata to a route handler, read later by
 * RolesGuard. This checks the user's GLOBAL role (User.role) — separate
 * from ProjectRole, which is per-project and checked independently
 * inside the relevant service methods (e.g. "is this user a MANAGER on
 * THIS specific project").
 */
export const Roles = (...roles: GlobalRole[]) => SetMetadata(ROLES_KEY, roles);

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export function isAdminRole(role?: string | null) {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

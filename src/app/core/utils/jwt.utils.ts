import { UserRole } from '../../store/auth/auth.actions';

export function resolveRole(storeRoles: string[]): UserRole {
  if (storeRoles.includes('STORE_ADMIN')) return 'STORE_ADMIN';
  if (storeRoles.includes('SELLER'))      return 'SELLER';
  return 'BUYER';
}

export function resolveRoleFromToken(token: string): UserRole {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const roles: string = payload.roles ?? '';
    if (roles.includes('STORE_ADMIN')) return 'STORE_ADMIN';
    if (roles.includes('SELLER'))      return 'SELLER';
  } catch {}
  return 'BUYER';
}

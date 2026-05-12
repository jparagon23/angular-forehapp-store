import { UserRole } from '../../store/auth/auth.actions';

export function resolveRole(storeRoles: string[]): UserRole {
  if (storeRoles.includes('STORE_ADMIN')) return 'STORE_ADMIN';
  if (storeRoles.includes('SELLER'))      return 'SELLER';
  return 'BUYER';
}

import type { AppUser } from '@/types/models';

export function isAdmin(user: AppUser | null | undefined): boolean {
  return user?.role === 'admin';
}

export function canCreateChannel(user: AppUser | null | undefined): boolean {
  return isAdmin(user);
}

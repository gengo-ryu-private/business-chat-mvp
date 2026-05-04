import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';

import type { AppUser } from '@/types/models';
import { canCreateChannel, isAdmin } from '@/utils/permissions';

function createUser(role: AppUser['role']): AppUser {
  return {
    id: 'user-001',
    displayName: '山田太郎',
    email: 'yamada@example.com',
    tenantId: 'tenant-001',
    role,
    createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
  };
}

describe('permission utils', () => {
  describe('isAdmin', () => {
    it('admin の場合 true を返す', () => {
      expect(isAdmin(createUser('admin'))).toBe(true);
    });

    it('member の場合 false を返す', () => {
      expect(isAdmin(createUser('member'))).toBe(false);
    });

    it('null の場合 false を返す', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('undefined の場合 false を返す', () => {
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe('canCreateChannel', () => {
    it('admin の場合 true を返す', () => {
      expect(canCreateChannel(createUser('admin'))).toBe(true);
    });

    it('member の場合 false を返す', () => {
      expect(canCreateChannel(createUser('member'))).toBe(false);
    });
  });
});

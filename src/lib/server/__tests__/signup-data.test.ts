import { describe, expect, it } from 'vitest';

import {
  buildAdminUserData,
  buildMemberUserData,
  buildSignupTenantData,
  buildSignupTenantSecretData,
} from '@/lib/server/signup-data';

describe('signup-data', () => {
  describe('buildSignupTenantData', () => {
    it('新規テナント保存用データを生成する', () => {
      const timestamp = { kind: 'serverTimestamp' };

      expect(
        buildSignupTenantData({
          tenantId: 'tenant-001',
          tenantName: ' 開発チーム ',
          createdBy: 'user-001',
          timestamp,
        })
      ).toEqual({
        id: 'tenant-001',
        name: '開発チーム',
        createdBy: 'user-001',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  });

  describe('buildSignupTenantSecretData', () => {
    it('参加コード保存用データを生成する', () => {
      const timestamp = { kind: 'serverTimestamp' };

      expect(
        buildSignupTenantSecretData({
          tenantId: 'tenant-001',
          joinCode: 'ABC2345678',
          timestamp,
        })
      ).toEqual({
        tenantId: 'tenant-001',
        joinCode: 'ABC2345678',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  });

  describe('buildAdminUserData', () => {
    it('role を admin に固定したユーザー保存用データを生成する', () => {
      const timestamp = { kind: 'serverTimestamp' };

      expect(
        buildAdminUserData({
          userId: 'user-001',
          displayName: ' 山田太郎 ',
          email: ' yamada@example.com ',
          tenantId: 'tenant-001',
          timestamp,
        })
      ).toEqual({
        id: 'user-001',
        displayName: '山田太郎',
        email: 'yamada@example.com',
        tenantId: 'tenant-001',
        role: 'admin',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  });

  describe('buildMemberUserData', () => {
    it('role を member に固定したユーザー保存用データを生成する', () => {
      const timestamp = { kind: 'serverTimestamp' };

      expect(
        buildMemberUserData({
          userId: 'user-002',
          displayName: ' 佐藤花子 ',
          email: ' sato@example.com ',
          tenantId: 'tenant-001',
          timestamp,
        })
      ).toEqual({
        id: 'user-002',
        displayName: '佐藤花子',
        email: 'sato@example.com',
        tenantId: 'tenant-001',
        role: 'member',
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  });
});

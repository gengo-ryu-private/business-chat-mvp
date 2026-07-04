import { describe, expect, it } from 'vitest';

import {
  buildAdminUserData,
  buildMemberUserData,
  buildSignupTenantData,
  buildSignupTenantSecretData,
  SignupApiError,
  validateCreateTenantSignupInput,
  validateJoinTenantSignupInput,
} from '@/lib/server/signup-data';
import { VALIDATION_LIMITS } from '@/utils/validation';

describe('signup-data', () => {
  describe('validateCreateTenantSignupInput', () => {
    it('新規テナント登録に必要な入力が揃っている場合は例外を投げない', () => {
      expect(() =>
        validateCreateTenantSignupInput({
          displayName: '山田太郎',
          email: 'yamada@example.com',
          password: 'password123',
          tenantName: '開発チーム',
        })
      ).not.toThrow();
    });

    it('ユーザー名とテナント名が上限ちょうどの場合は例外を投げない', () => {
      expect(() =>
        validateCreateTenantSignupInput({
          displayName: 'a'.repeat(VALIDATION_LIMITS.displayNameMax),
          email: 'yamada@example.com',
          password: 'password123',
          tenantName: 'b'.repeat(VALIDATION_LIMITS.tenantNameMax),
        })
      ).not.toThrow();
    });

    it('テナント名が空の場合はエラーを投げる', () => {
      expect(() =>
        validateCreateTenantSignupInput({
          displayName: '山田太郎',
          email: 'yamada@example.com',
          password: 'password123',
          tenantName: '   ',
        })
      ).toThrow(new SignupApiError('テナント名を入力してください。'));
    });

    it('ユーザー名が上限を超える場合はエラーを投げる', () => {
      expect(() =>
        validateCreateTenantSignupInput({
          displayName: 'a'.repeat(VALIDATION_LIMITS.displayNameMax + 1),
          email: 'yamada@example.com',
          password: 'password123',
          tenantName: '開発チーム',
        })
      ).toThrow(
        new SignupApiError(
          `ユーザー名は${VALIDATION_LIMITS.displayNameMax}文字以内で入力してください。`
        )
      );
    });

    it('テナント名が上限を超える場合はエラーを投げる', () => {
      expect(() =>
        validateCreateTenantSignupInput({
          displayName: '山田太郎',
          email: 'yamada@example.com',
          password: 'password123',
          tenantName: 'a'.repeat(VALIDATION_LIMITS.tenantNameMax + 1),
        })
      ).toThrow(
        new SignupApiError(
          `テナント名は${VALIDATION_LIMITS.tenantNameMax}文字以内で入力してください。`
        )
      );
    });
  });

  describe('validateJoinTenantSignupInput', () => {
    it('参加コード登録に必要な入力が揃っている場合は例外を投げない', () => {
      expect(() =>
        validateJoinTenantSignupInput({
          displayName: '佐藤花子',
          email: 'sato@example.com',
          password: 'password123',
          joinCode: 'ABC234',
        })
      ).not.toThrow();
    });

    it('参加コードが空の場合はエラーを投げる', () => {
      expect(() =>
        validateJoinTenantSignupInput({
          displayName: '佐藤花子',
          email: 'sato@example.com',
          password: 'password123',
          joinCode: '',
        })
      ).toThrow(new SignupApiError('参加コードを入力してください。'));
    });

    it('参加コード形式が不正な場合はエラーを投げる', () => {
      expect(() =>
        validateJoinTenantSignupInput({
          displayName: '佐藤花子',
          email: 'sato@example.com',
          password: 'password123',
          joinCode: '0OI123',
        })
      ).toThrow(
        new SignupApiError(
          '参加コードは6文字の英数字大文字で入力してください。'
        )
      );
    });

    it('メール形式が不正な場合はエラーを投げる', () => {
      expect(() =>
        validateJoinTenantSignupInput({
          displayName: '佐藤花子',
          email: 'invalid-email',
          password: 'password123',
          joinCode: 'ABC234',
        })
      ).toThrow(new SignupApiError('メールアドレスの形式が正しくありません。'));
    });
  });

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
          joinCode: 'ABC234',
          timestamp,
        })
      ).toEqual({
        tenantId: 'tenant-001',
        joinCode: 'ABC234',
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

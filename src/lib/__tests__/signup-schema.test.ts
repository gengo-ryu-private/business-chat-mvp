import { describe, expect, it } from 'vitest';

import {
  createTenantSignupSchema,
  getSignupValidationMessage,
  joinTenantSignupSchema,
} from '@/lib/signup-schema';
import { VALIDATION_LIMITS } from '@/utils/validation';

const createInput = {
  displayName: '山田太郎',
  email: 'yamada@example.com',
  password: 'password123',
  tenantName: '開発チーム',
};

describe('signup schemas', () => {
  it.each([null, [], 'invalid', 1])(
    'object以外の入力 %j を拒否する',
    (input) => {
      expect(createTenantSignupSchema.safeParse(input).success).toBe(false);
    }
  );

  it('余計なプロパティを拒否する', () => {
    expect(
      createTenantSignupSchema.safeParse({ ...createInput, role: 'admin' })
        .success
    ).toBe(false);
  });

  it.each([
    [
      '短すぎるパスワード',
      'a'.repeat(VALIDATION_LIMITS.passwordMin - 1),
      `パスワードは${VALIDATION_LIMITS.passwordMin}文字以上で入力してください。`,
    ],
    [
      '長すぎるパスワード',
      'a'.repeat(VALIDATION_LIMITS.passwordMax + 1),
      `パスワードは${VALIDATION_LIMITS.passwordMax}文字以内で入力してください。`,
    ],
    [
      'メールアドレスと同一のパスワード',
      createInput.email,
      'パスワードはメールアドレスと異なるものを入力してください。',
    ],
  ])('%sを拒否する', (_, password, message) => {
    const result = createTenantSignupSchema.safeParse({
      ...createInput,
      password,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getSignupValidationMessage(result.error)).toBe(message);
    }
  });

  it('共通要件を満たす参加リクエストを受け入れる', () => {
    expect(
      joinTenantSignupSchema.safeParse({
        displayName: '佐藤花子',
        email: 'sato@example.com',
        password: 'password123',
        joinCode: 'ABC2345678',
      }).success
    ).toBe(true);
  });
});

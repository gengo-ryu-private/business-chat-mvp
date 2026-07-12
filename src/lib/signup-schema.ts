import { z } from 'zod';

import { JOIN_CODE_PATTERN, VALIDATION_LIMITS } from '@/utils/validation';

const requiredString = (label: string) =>
  z
    .string({ error: `${label}を入力してください。` })
    .trim()
    .min(1, {
      error: `${label}を入力してください。`,
    });

const baseSignupShape = {
  displayName: requiredString('ユーザー名').max(
    VALIDATION_LIMITS.displayNameMax,
    `ユーザー名は${VALIDATION_LIMITS.displayNameMax}文字以内で入力してください。`
  ),
  email: requiredString('メールアドレス').pipe(
    z.email('メールアドレスの形式が正しくありません。')
  ),
  password: z
    .string({ error: 'パスワードを入力してください。' })
    .min(1, 'パスワードを入力してください。')
    .min(
      VALIDATION_LIMITS.passwordMin,
      `パスワードは${VALIDATION_LIMITS.passwordMin}文字以上で入力してください。`
    )
    .max(
      VALIDATION_LIMITS.passwordMax,
      `パスワードは${VALIDATION_LIMITS.passwordMax}文字以内で入力してください。`
    ),
};

const passwordDiffersFromEmail = (input: { email: string; password: string }) =>
  input.password !== input.email;

export const createTenantSignupSchema = z
  .strictObject({
    ...baseSignupShape,
    tenantName: requiredString('テナント名').max(
      VALIDATION_LIMITS.tenantNameMax,
      `テナント名は${VALIDATION_LIMITS.tenantNameMax}文字以内で入力してください。`
    ),
  })
  .refine(passwordDiffersFromEmail, {
    message: 'パスワードはメールアドレスと異なるものを入力してください。',
    path: ['password'],
  });

export const joinTenantSignupSchema = z
  .strictObject({
    ...baseSignupShape,
    joinCode: requiredString('参加コード').regex(
      JOIN_CODE_PATTERN,
      '参加コードは10文字の英数字大文字で入力してください。'
    ),
  })
  .refine(passwordDiffersFromEmail, {
    message: 'パスワードはメールアドレスと異なるものを入力してください。',
    path: ['password'],
  });

export type CreateTenantSignupInput = z.output<typeof createTenantSignupSchema>;
export type JoinTenantSignupInput = z.output<typeof joinTenantSignupSchema>;

export function getSignupValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? '入力内容を確認してください。';
}

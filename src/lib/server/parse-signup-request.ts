import { type ZodType } from 'zod';

import { getSignupValidationMessage } from '@/lib/signup-schema';
import { SignupApiError } from '@/lib/server/signup-data';

export async function parseSignupRequest<T>(
  request: Request,
  schema: ZodType<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new SignupApiError('JSONの形式が正しくありません。');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const hasUnknownKeys = result.error.issues.some(
      (issue) => issue.code === 'unrecognized_keys'
    );
    throw new SignupApiError(
      hasUnknownKeys
        ? '許可されていない項目が含まれています。'
        : getSignupValidationMessage(result.error)
    );
  }

  return result.data;
}

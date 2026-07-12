import { NextResponse } from 'next/server';

import { createTenantSignup } from '@/lib/server/signup';
import { createTenantSignupSchema } from '@/lib/signup-schema';
import { SignupApiError } from '@/lib/server/signup-data';
import { parseSignupRequest } from '@/lib/server/parse-signup-request';
import { enforceSignupRateLimit } from '@/lib/server/signup-rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rateLimitResponse = await enforceSignupRateLimit(
    request,
    'create-tenant'
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (process.env.DISABLE_PUBLIC_TENANT_SIGNUP === 'true') {
    return NextResponse.json(
      {
        ok: false,
        message: 'デモ環境では新規テナント作成を無効化しています。',
      },
      { status: 403 }
    );
  }

  try {
    const input = await parseSignupRequest(request, createTenantSignupSchema);
    await createTenantSignup(input);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof SignupApiError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { ok: false, message: 'ユーザー登録に失敗しました。' },
      { status: 500 }
    );
  }
}

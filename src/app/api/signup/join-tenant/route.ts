import { NextResponse } from 'next/server';

import {
  joinTenantSignup,
  type JoinTenantSignupInput,
} from '@/lib/server/signup';
import { SignupApiError } from '@/lib/server/signup-data';
import { enforceSignupRateLimit } from '@/lib/server/signup-rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const rateLimitResponse = await enforceSignupRateLimit(
    request,
    'join-tenant'
  );

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const input = (await request.json()) as JoinTenantSignupInput;
    await joinTenantSignup(input);

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

import { NextResponse } from 'next/server';

import {
  createTenantSignup,
  type CreateTenantSignupInput,
} from '@/lib/server/signup';
import { SignupApiError } from '@/lib/server/signup-data';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as CreateTenantSignupInput;
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

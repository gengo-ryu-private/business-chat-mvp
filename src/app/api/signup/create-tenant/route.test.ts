import { afterEach, describe, expect, it, vi } from 'vitest';

const { createTenantSignup } = vi.hoisted(() => ({
  createTenantSignup: vi.fn(),
}));

vi.mock('@/lib/server/signup', () => ({ createTenantSignup }));
vi.mock('@/lib/server/signup-data', () => ({
  SignupApiError: class SignupApiError extends Error {
    constructor(
      message: string,
      readonly status = 400
    ) {
      super(message);
    }
  },
}));

import { POST } from '@/app/api/signup/create-tenant/route';

const signupInput = {
  displayName: '山田太郎',
  email: 'yamada@example.com',
  password: 'password123',
  tenantName: 'テスト株式会社',
};

function createRequest() {
  return new Request('http://localhost/api/signup/create-tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupInput),
  });
}

describe('POST /api/signup/create-tenant', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('新規テナント作成が無効な場合は処理を行わず403を返す', async () => {
    vi.stubEnv('DISABLE_PUBLIC_TENANT_SIGNUP', 'true');

    const response = await POST(createRequest());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      ok: false,
      message: 'デモ環境では新規テナント作成を無効化しています。',
    });
    expect(createTenantSignup).not.toHaveBeenCalled();
  });

  it.each([undefined, 'false'])(
    '環境変数が%sの場合は既存の作成処理を行う',
    async (value) => {
      if (value !== undefined) {
        vi.stubEnv('DISABLE_PUBLIC_TENANT_SIGNUP', value);
      }

      const response = await POST(createRequest());

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(createTenantSignup).toHaveBeenCalledWith(signupInput);
    }
  );
});

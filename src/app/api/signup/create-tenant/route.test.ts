import { afterEach, describe, expect, it, vi } from 'vitest';

const { createTenantSignup, enforceSignupRateLimit } = vi.hoisted(() => ({
  createTenantSignup: vi.fn(),
  enforceSignupRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/server/signup', () => ({ createTenantSignup }));
vi.mock('@/lib/server/signup-rate-limit', () => ({ enforceSignupRateLimit }));
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

function createRequest(body: BodyInit = JSON.stringify(signupInput)) {
  return new Request('http://localhost/api/signup/create-tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

describe('POST /api/signup/create-tenant', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('rate limit超過時は作成処理を行わず429を返す', async () => {
    enforceSignupRateLimit.mockResolvedValueOnce(
      Response.json(
        {
          ok: false,
          message:
            'リクエスト回数が多すぎます。しばらく待ってから再試行してください。',
        },
        { status: 429 }
      )
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(429);
    expect(enforceSignupRateLimit).toHaveBeenCalledWith(
      expect.any(Request),
      'create-tenant'
    );
    expect(createTenantSignup).not.toHaveBeenCalled();
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

  it.each([
    ['不正JSON', '{'],
    ['null', 'null'],
    ['配列', '[]'],
    ['不正な型', JSON.stringify({ ...signupInput, displayName: 123 })],
    ['余計なプロパティ', JSON.stringify({ ...signupInput, role: 'admin' })],
  ])('%sは400を返す', async (_, body) => {
    const response = await POST(createRequest(body));

    expect(response.status).toBe(400);
    expect(createTenantSignup).not.toHaveBeenCalled();
  });

  it.each([
    ['短いパスワード', { ...signupInput, password: 'short' }],
    ['長いパスワード', { ...signupInput, password: 'a'.repeat(73) }],
    [
      'メールアドレスと同一のパスワード',
      { ...signupInput, password: signupInput.email },
    ],
  ])('%sは400を返す', async (_, input) => {
    const response = await POST(createRequest(JSON.stringify(input)));

    expect(response.status).toBe(400);
    expect(createTenantSignup).not.toHaveBeenCalled();
  });
});

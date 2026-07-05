import { afterEach, describe, expect, it, vi } from 'vitest';

const { joinTenantSignup, enforceSignupRateLimit } = vi.hoisted(() => ({
  joinTenantSignup: vi.fn(),
  enforceSignupRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/server/signup', () => ({ joinTenantSignup }));
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

import { POST } from '@/app/api/signup/join-tenant/route';

const signupInput = {
  displayName: '佐藤花子',
  email: 'sato@example.com',
  password: 'password123',
  joinCode: 'ABCDEFGHJK',
};

function createRequest() {
  return new Request('http://localhost/api/signup/join-tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupInput),
  });
}

describe('POST /api/signup/join-tenant', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rate limit超過時は参加処理を行わず429を返す', async () => {
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
      'join-tenant'
    );
    expect(joinTenantSignup).not.toHaveBeenCalled();
  });

  it('rate limit未超過時は既存の参加処理を行う', async () => {
    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(joinTenantSignup).toHaveBeenCalledWith(signupInput);
  });
});

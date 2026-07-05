import { afterEach, describe, expect, it, vi } from 'vitest';

const { limit, slidingWindow, redisConstructor, ratelimitConstructor } =
  vi.hoisted(() => ({
    limit: vi.fn(),
    slidingWindow: vi.fn(() => 'limiter'),
    redisConstructor: vi.fn(),
    ratelimitConstructor: vi.fn(),
  }));

vi.mock('server-only', () => ({}));
vi.mock('@upstash/redis', () => ({
  Redis: class Redis {
    constructor(config: unknown) {
      redisConstructor(config);
    }
  },
}));
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class Ratelimit {
    static slidingWindow = slidingWindow;

    constructor(config: unknown) {
      ratelimitConstructor(config);
    }

    limit = limit;
  },
}));

import {
  enforceSignupRateLimit,
  getClientIp,
} from '@/lib/server/signup-rate-limit';

describe('signup rate limit', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('x-forwarded-forの先頭からクライアントIPを取得する', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    });

    expect(getClientIp(request)).toBe('203.0.113.10');
  });

  it.each([undefined, 'false'])(
    'RATE_LIMIT_ENABLEDが%sの場合はrate limitを無効化する',
    async (value) => {
      if (value !== undefined) {
        vi.stubEnv('RATE_LIMIT_ENABLED', value);
      }
      vi.stubEnv(
        'UPSTASH_REDIS_REST_KV_REST_API_URL',
        'https://example.upstash.io'
      );
      vi.stubEnv('UPSTASH_REDIS_REST_KV_REST_API_TOKEN', 'token');

      const response = await enforceSignupRateLimit(
        new Request('http://localhost'),
        'create-tenant'
      );

      expect(response).toBeNull();
      expect(ratelimitConstructor).not.toHaveBeenCalled();
    }
  );

  it('Upstash環境変数が未設定の場合はrate limitを無効化する', async () => {
    vi.stubEnv('RATE_LIMIT_ENABLED', 'true');
    const response = await enforceSignupRateLimit(
      new Request('http://localhost'),
      'create-tenant'
    );

    expect(response).toBeNull();
    expect(ratelimitConstructor).not.toHaveBeenCalled();
  });

  it('制限超過時はRetry-After付きの429を返す', async () => {
    vi.stubEnv('RATE_LIMIT_ENABLED', 'true');
    vi.stubEnv(
      'UPSTASH_REDIS_REST_KV_REST_API_URL',
      'https://example.upstash.io'
    );
    vi.stubEnv('UPSTASH_REDIS_REST_KV_REST_API_TOKEN', 'token');
    limit.mockResolvedValue({
      success: false,
      reset: Date.now() + 60_000,
    });
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '203.0.113.20' },
    });

    const response = await enforceSignupRateLimit(request, 'create-tenant');

    expect(response?.status).toBe(429);
    expect(response?.headers.get('Retry-After')).toBe('60');
    expect(await response?.json()).toEqual({
      ok: false,
      message:
        'リクエスト回数が多すぎます。しばらく待ってから再試行してください。',
    });
    expect(limit).toHaveBeenCalledWith('203.0.113.20');
    expect(slidingWindow).toHaveBeenCalledWith(3, '1 h');
    expect(ratelimitConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'business-chat-mvp:signup:create-tenant',
      })
    );
  });

  it('join-tenantには10分間に5回の独立した制限を適用する', async () => {
    vi.stubEnv('RATE_LIMIT_ENABLED', 'true');
    vi.stubEnv(
      'UPSTASH_REDIS_REST_KV_REST_API_URL',
      'https://example.upstash.io'
    );
    vi.stubEnv('UPSTASH_REDIS_REST_KV_REST_API_TOKEN', 'token');
    limit.mockResolvedValue({ success: true });

    const response = await enforceSignupRateLimit(
      new Request('http://localhost'),
      'join-tenant'
    );

    expect(response).toBeNull();
    expect(slidingWindow).toHaveBeenCalledWith(5, '10 m');
    expect(ratelimitConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'business-chat-mvp:signup:join-tenant',
      })
    );
  });
});

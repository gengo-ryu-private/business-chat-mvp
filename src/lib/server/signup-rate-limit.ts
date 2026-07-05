import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const RATE_LIMIT_MESSAGE =
  'リクエスト回数が多すぎます。しばらく待ってから再試行してください。';
const SIGNUP_RATE_LIMITS = {
  'create-tenant': { maxRequests: 3, window: '1 h' },
  'join-tenant': { maxRequests: 5, window: '10 m' },
} as const;

export type SignupRateLimitScope = keyof typeof SIGNUP_RATE_LIMITS;

type RateLimiterCache = {
  key: string;
  limiter: Ratelimit;
};

const cachedRateLimiters = new Map<SignupRateLimitScope, RateLimiterCache>();

export async function enforceSignupRateLimit(
  request: Request,
  scope: SignupRateLimitScope
): Promise<NextResponse | null> {
  const limiter = getRateLimiter(scope);

  if (!limiter) {
    return null;
  }

  try {
    const result = await limiter.limit(getClientIp(request));

    if (result.success) {
      return null;
    }

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000)
    );

    return NextResponse.json(
      { ok: false, message: RATE_LIMIT_MESSAGE },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }
    );
  } catch {
    // Redisの一時障害でsignup API全体が停止しないよう、失敗時は処理を継続する。
    return null;
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function getRateLimiter(scope: SignupRateLimitScope): Ratelimit | null {
  if (process.env.RATE_LIMIT_ENABLED !== 'true') {
    return null;
  }

  const url = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  const { maxRequests, window } = SIGNUP_RATE_LIMITS[scope];
  const cacheKey = `${url}:${token}`;
  const cachedRateLimiter = cachedRateLimiters.get(scope);

  if (cachedRateLimiter?.key === cacheKey) {
    return cachedRateLimiter.limiter;
  }

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(maxRequests, window),
    prefix: `business-chat-mvp:signup:${scope}`,
    timeout: 1_000,
  });

  cachedRateLimiters.set(scope, { key: cacheKey, limiter });
  return limiter;
}

import { NextRequest, NextResponse } from "next/server";

type Entry = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, Entry>();

function getClientIp(request: NextRequest): string {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) return realIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "local";
}

function checkMemoryRateLimit(
  compositeKey: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const existing = memoryStore.get(compositeKey);

  if (!existing || now > existing.resetAt) {
    memoryStore.set(compositeKey, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (existing.count >= limit) return true;

  existing.count += 1;
  memoryStore.set(compositeKey, existing);
  return false;
}

let redisRateLimiterCache: Map<string, import("@upstash/ratelimit").Ratelimit> | null = null;

async function getRedisLimiter(
  key: string,
  limit: number,
  windowMs: number
): Promise<import("@upstash/ratelimit").Ratelimit | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");

    if (!redisRateLimiterCache) {
      redisRateLimiterCache = new Map();
    }

    const cacheKey = `${key}:${limit}:${windowMs}`;
    if (redisRateLimiterCache.has(cacheKey)) {
      return redisRateLimiterCache.get(cacheKey)!;
    }

    const redis = new Redis({ url, token });
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: `nexora:rl`,
    });

    redisRateLimiterCache.set(cacheKey, limiter);
    return limiter;
  } catch {
    return null;
  }
}

export async function checkRateLimit(
  request: NextRequest,
  options: { key: string; limit: number; windowMs: number }
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const compositeKey = `${options.key}:${ip}`;

  const hasRedis =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (process.env.NODE_ENV === "production" && !hasRedis) {
    console.warn(
      "[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set; using in-memory limits (not shared across instances)."
    );
  }

  const limiter = await getRedisLimiter(options.key, options.limit, options.windowMs);

  if (limiter) {
    const { success } = await limiter.limit(compositeKey);
    if (!success) {
      return NextResponse.json({ error: "Too Many Requests." }, { status: 429 });
    }
    return null;
  }

  const exceeded = checkMemoryRateLimit(compositeKey, options.limit, options.windowMs);
  if (exceeded) {
    return NextResponse.json({ error: "Too Many Requests." }, { status: 429 });
  }
  return null;
}

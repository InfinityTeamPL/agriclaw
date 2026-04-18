import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const useRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

let redisLimiter: Ratelimit | null = null;

if (useRedis) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  redisLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "agentai:rl",
  });
}

const hits = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  hits.forEach((val, key) => {
    if (val.resetAt < now) hits.delete(key);
  });
}, 60000);

function memoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return { ok: false, remaining: 0 };
  }

  return { ok: true, remaining: maxRequests - entry.count };
}

export function rateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): { ok: boolean; remaining: number } {
  return memoryRateLimit(key, maxRequests, windowMs);
}

export function rateLimitByIp(
  request: Request,
  maxRequests: number = 30,
  windowMs: number = 60000
): { ok: boolean; remaining: number } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return rateLimit(`ip:${ip}`, maxRequests, windowMs);
}

export async function rateLimitByIpAsync(
  request: Request,
  maxRequests: number = 30,
  windowMs: number = 60000
): Promise<{ ok: boolean; remaining: number }> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (redisLimiter) {
    const result = await redisLimiter.limit(`ip:${ip}`);
    return { ok: result.success, remaining: result.remaining };
  }

  return memoryRateLimit(`ip:${ip}`, maxRequests, windowMs);
}

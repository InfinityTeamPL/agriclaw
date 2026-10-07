import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const useRedis = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = useRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Jeden Ratelimit na parę (max, okno). Wcześniej limiter Redis miał na sztywno 30/60 s
// i ignorował parametry wywołania — np. rejestracja (5 na 15 min) dostawała 30 na minutę.
const redisLimiters = new Map<string, Ratelimit>();
function getRedisLimiter(maxRequests: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${maxRequests}:${windowMs}`;
  let limiter = redisLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${Math.max(1, Math.round(windowMs / 1000))} s`),
      analytics: true,
      prefix: `agentai:rl:${cacheKey}`,
    });
    redisLimiters.set(cacheKey, limiter);
  }
  return limiter;
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

/** Limit po dowolnym kluczu (np. `diagnose:${userId}`). Redis, a przy awarii lub braku — pamięć instancji. */
export async function rateLimitAsync(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60000
): Promise<{ ok: boolean; remaining: number }> {
  const limiter = getRedisLimiter(maxRequests, windowMs);
  if (limiter) {
    try {
      const result = await limiter.limit(key);
      return { ok: result.success, remaining: result.remaining };
    } catch {
      // Awaria Upstash (sieć/limit) NIE MOŻE blokować logowania/rejestracji ani pracy rolnika.
      // Fail-open na limiter w pamięci — degradacja, nie odmowa usługi (500).
      return memoryRateLimit(key, maxRequests, windowMs);
    }
  }
  return memoryRateLimit(key, maxRequests, windowMs);
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
  return rateLimitAsync(`ip:${ip}`, maxRequests, windowMs);
}

/**
 * Ochrona kosztownych endpointów (LLM, Copernicus, geokodowanie) — limit na użytkownika.
 * Zwraca gotową odpowiedź 429 po polsku albo null, gdy można działać dalej.
 */
export async function limitUser(
  userId: string,
  scope: string,
  maxRequests: number,
  windowMs: number,
): Promise<Response | null> {
  const rl = await rateLimitAsync(`${scope}:${userId}`, maxRequests, windowMs);
  if (rl.ok) return null;
  return new Response(
    JSON.stringify({ error: 'Za dużo żądań. Odczekaj chwilę i spróbuj ponownie.' }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(windowMs / 1000)) },
    },
  );
}

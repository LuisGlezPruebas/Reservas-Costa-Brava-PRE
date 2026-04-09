import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a new ratelimiter that allows 10 requests per 10 seconds
// For production, use Upstash Redis. For development, use in-memory store
let ratelimit: Ratelimit;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  // Production: Use Upstash Redis
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
} else {
  // Development: Use in-memory store
  ratelimit = new Ratelimit({
    redis: new Map() as any,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: false,
  });
}

// Stricter rate limit for login attempts (5 per minute)
let loginRatelimit: Ratelimit;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  loginRatelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "@upstash/ratelimit/login",
  });
} else {
  loginRatelimit = new Ratelimit({
    redis: new Map() as any,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: false,
  });
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  return { success, limit, remaining, reset };
}

export async function checkLoginRateLimit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { success, limit, remaining, reset } = await loginRatelimit.limit(identifier);
  return { success, limit, remaining, reset };
}

// Made with Bob

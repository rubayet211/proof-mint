interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function createRateLimiter(options: {
  maxRequests: number;
  windowMs: number;
  now?: () => number;
}) {
  const hits = new Map<string, RateLimitEntry>();
  const now = options.now || Date.now;

  return {
    check(key: string): RateLimitResult {
      const currentTime = now();
      const current = hits.get(key);

      if (!current || current.resetAt <= currentTime) {
        hits.set(key, { count: 1, resetAt: currentTime + options.windowMs });
        return { allowed: true };
      }

      if (current.count >= options.maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - currentTime) / 1000)),
        };
      }

      current.count += 1;
      return { allowed: true };
    },
  };
}

export const mintProofRateLimiter = createRateLimiter({
  maxRequests: Number(process.env.MINT_PROOF_RATE_LIMIT_MAX || 10),
  windowMs: Number(process.env.MINT_PROOF_RATE_LIMIT_WINDOW_MS || 60_000),
});

import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("rate limiter", () => {
  it("blocks requests after the configured limit within a window", () => {
    let now = 1000;
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000, now: () => now });

    expect(limiter.check("0.0.123").allowed).toBe(true);
    expect(limiter.check("0.0.123").allowed).toBe(true);

    const blocked = limiter.check("0.0.123");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);

    now = 2001;
    expect(limiter.check("0.0.123").allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 1000, now: () => 1000 });

    expect(limiter.check("0.0.123").allowed).toBe(true);
    expect(limiter.check("0.0.456").allowed).toBe(true);
    expect(limiter.check("0.0.123").allowed).toBe(false);
  });
});

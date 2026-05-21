import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

// Simple in-memory rate limiter
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests
  keyGenerator?: (req: Request) => string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests default
    keyGenerator = (req: Request) => req.ip || "unknown",
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    record.count++;

    if (record.count > max) {
      throw new ApiError(
        429,
        `Too many requests. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds`
      );
    }

    next();
  };
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Specific rate limits for different endpoints
export const pairingCodeRateLimit = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 pairing code requests per hour
  keyGenerator: (req) => req.body.phoneNumber || req.ip || "unknown",
});

export const generalRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
});

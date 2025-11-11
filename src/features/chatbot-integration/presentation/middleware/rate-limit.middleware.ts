import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv'; // Using Vercel KV for rate limiting

interface RateLimitOptions {
  windowMs: number; // Window in milliseconds
  max: number; // Max requests per window
}

class MemoryStore {
  private hits: Map<string, number[]> = new Map();

  increment(key: string): number {
    const now = Date.now();
    const hits = this.hits.get(key) || [];
    
    // Remove hits that are outside the window
    const validHits = hits.filter(timestamp => now - timestamp < 3600000); // 1 hour window
    validHits.push(now);
    
    this.hits.set(key, validHits);
    return validHits.length;
  }

  reset(key: string): void {
    this.hits.delete(key);
  }
}

// In-memory store for development, can be replaced with Redis in production
const memoryStore = new MemoryStore();

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const { windowMs = 3600000, max = 100 } = options; // Default: 100 requests per hour

  return async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
    // Extract client IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.connection?.remoteAddress || 
               'unknown';
    
    if (!ip) {
      return NextResponse.json(
        { error: 'Unable to determine client IP' },
        { status: 500 }
      );
    }

    // Create a unique key for this IP and endpoint
    const key = `rate_limit:${ip}:${request.nextUrl.pathname}`;
    
    // Use memory store for simple in-memory rate limiting
    // In production, you'd want to use a persistent store like Redis
    const currentHits = memoryStore.increment(key);
    
    if (currentHits > max) {
      // Rate limit exceeded
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(windowMs / 1000), // seconds
          limit: max,
          remaining: 0,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor((Date.now() + windowMs) / 1000).toString(),
          },
        }
      );
    }

    // Rate limit not exceeded, continue with the request
    // Note: We could set rate limit headers here, but they would need to be
    // passed through context since we return null (not a response)
    return null;
  };
}

// Default rate limiter for chatbot API (100 requests per hour)
export const defaultRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100 // 100 requests per hour
});
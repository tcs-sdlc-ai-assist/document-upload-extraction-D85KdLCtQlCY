import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../services/logging.service';
import { EventType } from '../common/enums/event-type.enum';

interface RateLimitEntry {
  count: number;
  timestamps: number[];
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly store: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {
    this.maxRequests = parseInt(
      this.configService.get<string>('RATE_LIMIT_MAX_REQUESTS') || '5',
      10,
    );
    this.windowMs = parseInt(
      this.configService.get<string>('RATE_LIMIT_WINDOW_MS') || '60000',
      10,
    );

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.windowMs * 2);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ip = this.extractIp(req);
    const now = Date.now();

    let entry = this.store.get(ip);

    if (!entry) {
      entry = { count: 0, timestamps: [] };
      this.store.set(ip, entry);
    }

    entry.timestamps = entry.timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs,
    );
    entry.count = entry.timestamps.length;

    if (entry.count >= this.maxRequests) {
      const oldestTimestamp = entry.timestamps[0];
      const retryAfterMs = this.windowMs - (now - oldestTimestamp);
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.setHeader('X-RateLimit-Limit', String(this.maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((oldestTimestamp + this.windowMs) / 1000)));

      await this.loggingService.logSecurityEvent(
        EventType.RATE_LIMIT_EXCEEDED,
        undefined,
        {
          ip,
          path: req.path,
          method: req.method,
          requestCount: entry.count,
          windowMs: this.windowMs,
        },
        ip,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.timestamps.push(now);
    entry.count = entry.timestamps.length;

    const remaining = Math.max(0, this.maxRequests - entry.count);

    res.setHeader('X-RateLimit-Limit', String(this.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader(
      'X-RateLimit-Reset',
      String(Math.ceil((entry.timestamps[0] + this.windowMs) / 1000)),
    );

    next();
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const ip = forwardedStr.split(',')[0].trim();
      if (ip.length > 0) {
        return ip;
      }
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [ip, entry] of this.store.entries()) {
      entry.timestamps = entry.timestamps.filter(
        (timestamp) => now - timestamp < this.windowMs,
      );
      entry.count = entry.timestamps.length;

      if (entry.count === 0) {
        this.store.delete(ip);
      }
    }
  }
}
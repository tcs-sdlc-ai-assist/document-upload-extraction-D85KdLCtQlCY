import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { SessionBlacklistRepository } from '../repositories/session-blacklist.repository';
import { UserRepository } from '../repositories/user.repository';
import { LoggingService } from '../services/logging.service';
import { EventType } from '../common/enums/event-type.enum';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
  token?: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly sessionBlacklistRepository: SessionBlacklistRepository,
    private readonly userRepository: UserRepository,
    private readonly loggingService: LoggingService,
  ) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const decoded = this.tokenService.verifyToken(token);

    if (!decoded) {
      throw new UnauthorizedException('Session expired or invalid.');
    }

    const isBlacklisted = await this.sessionBlacklistRepository.isTokenBlacklisted(token);

    if (isBlacklisted) {
      await this.loggingService.logSecurityEvent(
        EventType.SESSION_EXPIRED,
        decoded.sub,
        { reason: 'Token blacklisted' },
        req.ip,
      );
      throw new UnauthorizedException('Session expired or invalid.');
    }

    const user = await this.userRepository.findActiveById(decoded.sub);

    if (!user) {
      throw new UnauthorizedException('Session expired or invalid.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
    req.token = token;

    next();
  }

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token.length > 0) {
        return token;
      }
    }

    if (req.cookies && req.cookies.session) {
      return req.cookies.session;
    }

    return null;
  }
}
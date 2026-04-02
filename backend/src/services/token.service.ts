import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jsonwebtoken from 'jsonwebtoken';
import { SessionBlacklistRepository } from '../repositories/session-blacklist.repository';

export interface TokenPayload {
  sub: string;
  email: string;
  displayName: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface DecodedToken {
  sub: string;
  email: string;
  displayName: string;
  iat: number;
  exp: number;
  jti?: string;
}

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiration: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionBlacklistRepository: SessionBlacklistRepository,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiration = this.configService.get<string>('JWT_EXPIRATION') || '1h';
  }

  generateToken(payload: TokenPayload): string {
    const { iat, exp, ...cleanPayload } = payload;

    const token = jsonwebtoken.sign(cleanPayload, this.jwtSecret, {
      expiresIn: this.jwtExpiration,
    });

    return token;
  }

  verifyToken(token: string): DecodedToken | null {
    try {
      const decoded = jsonwebtoken.verify(token, this.jwtSecret) as DecodedToken;
      return decoded;
    } catch {
      return null;
    }
  }

  extractPayload(token: string): DecodedToken | null {
    try {
      const decoded = jsonwebtoken.decode(token) as DecodedToken;
      return decoded;
    } catch {
      return null;
    }
  }

  async isTokenValid(token: string): Promise<boolean> {
    const decoded = this.verifyToken(token);
    if (!decoded) {
      return false;
    }

    const isBlacklisted = await this.sessionBlacklistRepository.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return false;
    }

    return true;
  }

  getExpirationDate(token: string): Date | null {
    const decoded = this.extractPayload(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  }

  getUserIdFromToken(token: string): string | null {
    const decoded = this.extractPayload(token);
    if (!decoded) {
      return null;
    }

    return decoded.sub;
  }
}
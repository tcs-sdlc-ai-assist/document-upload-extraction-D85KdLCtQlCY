import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { SessionBlacklistRepository } from '../repositories/session-blacklist.repository';
import { TokenService } from './token.service';
import { LoggingService } from './logging.service';
import { AuthResponseDto, SessionDto, LogoutResponseDto, UserInfoDto } from '../common/dto/auth.dto';
import { EventType } from '../common/enums/event-type.enum';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly sessionBlacklistRepository: SessionBlacklistRepository,
    private readonly loggingService: LoggingService,
  ) {}

  async login(email: string, password: string, ipAddress?: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findActiveByEmail(email);

    if (!user) {
      await this.loggingService.logSecurityEvent(
        EventType.LOGIN_FAILURE,
        undefined,
        { email, reason: 'User not found' },
        ipAddress,
      );
      throw new UnauthorizedException('Invalid username or password.');
    }

    const isPasswordValid = await this.userRepository.verifyPassword(password, user.hashedPassword);

    if (!isPasswordValid) {
      await this.loggingService.logSecurityEvent(
        EventType.LOGIN_FAILURE,
        user.id,
        { email, reason: 'Invalid password' },
        ipAddress,
      );
      throw new UnauthorizedException('Invalid username or password.');
    }

    if (!user.isActive) {
      await this.loggingService.logSecurityEvent(
        EventType.LOGIN_FAILURE,
        user.id,
        { email, reason: 'User is inactive' },
        ipAddress,
      );
      throw new UnauthorizedException('Invalid username or password.');
    }

    const token = this.tokenService.generateToken({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    const userInfo = this.mapUserToUserInfo(user);

    await this.loggingService.logSecurityEvent(
      EventType.LOGIN_SUCCESS,
      user.id,
      { email },
      ipAddress,
    );

    return {
      user: userInfo,
      token,
    };
  }

  async logout(token: string, ipAddress?: string): Promise<LogoutResponseDto> {
    const decoded = this.tokenService.verifyToken(token);

    if (!decoded) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const isBlacklisted = await this.sessionBlacklistRepository.isTokenBlacklisted(token);

    if (isBlacklisted) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const expiresAt = this.tokenService.getExpirationDate(token);

    await this.sessionBlacklistRepository.blacklistToken(
      token,
      decoded.sub,
      expiresAt || new Date(),
    );

    await this.loggingService.logSecurityEvent(
      EventType.LOGOUT,
      decoded.sub,
      { email: decoded.email },
      ipAddress,
    );

    return {
      message: 'Logged out successfully.',
    };
  }

  async validateSession(token: string): Promise<SessionDto> {
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
      );
      throw new UnauthorizedException('Session expired or invalid.');
    }

    const user = await this.userRepository.findActiveById(decoded.sub);

    if (!user) {
      throw new UnauthorizedException('Session expired or invalid.');
    }

    const expiresAt = this.tokenService.getExpirationDate(token);

    return {
      user: this.mapUserToUserInfo(user),
      expiresAt: expiresAt ? expiresAt.toISOString() : new Date().toISOString(),
    };
  }

  async validateToken(token: string): Promise<User | null> {
    const isValid = await this.tokenService.isTokenValid(token);

    if (!isValid) {
      return null;
    }

    const userId = this.tokenService.getUserIdFromToken(token);

    if (!userId) {
      return null;
    }

    return this.userRepository.findActiveById(userId);
  }

  private mapUserToUserInfo(user: User): UserInfoDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }
}
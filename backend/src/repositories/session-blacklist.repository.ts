import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SessionBlacklist } from '../entities/session-blacklist.entity';

@Injectable()
export class SessionBlacklistRepository {
  constructor(
    @InjectRepository(SessionBlacklist)
    private readonly sessionBlacklistRepository: Repository<SessionBlacklist>,
  ) {}

  async blacklistToken(
    token: string,
    userId: string,
    expiresAt: Date,
  ): Promise<SessionBlacklist> {
    const entry = this.sessionBlacklistRepository.create({
      token,
      userId,
      expiresAt,
    });

    return this.sessionBlacklistRepository.save(entry);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const entry = await this.sessionBlacklistRepository.findOne({
      where: { token },
    });

    return !!entry;
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.sessionBlacklistRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  async blacklistAllForUser(userId: string): Promise<SessionBlacklist[]> {
    const entries = await this.sessionBlacklistRepository.find({
      where: { userId },
    });

    return entries;
  }
}
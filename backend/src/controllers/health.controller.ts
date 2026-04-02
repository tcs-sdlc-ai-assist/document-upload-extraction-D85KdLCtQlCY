import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Controller('api/health')
export class HealthController {
  private readonly startTime: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.startTime = Date.now();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);

    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      await this.userRepository.query('SELECT 1');
      databaseStatus = 'connected';
    } catch {
      databaseStatus = 'disconnected';
    }

    const isHealthy = databaseStatus === 'connected';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
      database: databaseStatus,
    };
  }
}
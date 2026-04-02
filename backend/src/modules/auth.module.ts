import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { LoggingService } from '../services/logging.service';
import { UserRepository } from '../repositories/user.repository';
import { SessionBlacklistRepository } from '../repositories/session-blacklist.repository';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { User } from '../entities/user.entity';
import { SessionBlacklist } from '../entities/session-blacklist.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, SessionBlacklist, AuditLog]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    LoggingService,
    UserRepository,
    SessionBlacklistRepository,
    AuthMiddleware,
  ],
  exports: [
    AuthMiddleware,
    AuthService,
    TokenService,
    LoggingService,
    UserRepository,
    SessionBlacklistRepository,
  ],
})
export class AuthModule {}
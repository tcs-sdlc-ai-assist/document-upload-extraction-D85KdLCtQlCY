import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { SessionBlacklist } from '../entities/session-blacklist.entity';
import { AuditLog } from '../entities/audit-log.entity';

export const DatabaseConfig = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const isProduction = configService.get<string>('NODE_ENV') === 'production';

    return {
      type: 'postgres' as const,
      url: databaseUrl,
      entities: [User, Document, SessionBlacklist, AuditLog],
      synchronize: !isProduction,
      logging: !isProduction,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      extra: {
        max: 20,
        min: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
    };
  },
});
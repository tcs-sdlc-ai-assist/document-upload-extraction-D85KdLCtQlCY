import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { Document } from '../entities/document.entity';
import { SessionBlacklist } from '../entities/session-blacklist.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { logger } from '../config/logger.config';

dotenv.config();

const BCRYPT_ROUNDS = 12;

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.error('DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  const adminDisplayName = process.env.ADMIN_DISPLAY_NAME || 'Admin';

  if (adminPassword.length < 8) {
    logger.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [User, Document, SessionBlacklist, AuditLog],
    synchronize: !isProduction,
    logging: !isProduction,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    logger.info('Database connection established.');

    const userRepository = dataSource.getRepository(User);

    const existingUserCount = await userRepository.count();

    if (existingUserCount > 0) {
      logger.info(`Database already has ${existingUserCount} user(s). Skipping seed.`);
      await dataSource.destroy();
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

    const adminUser = userRepository.create({
      email: adminEmail,
      hashedPassword,
      displayName: adminDisplayName,
      isActive: true,
    });

    await userRepository.save(adminUser);

    logger.info('Default admin user created successfully.', {
      email: adminEmail,
      displayName: adminDisplayName,
      userId: adminUser.id,
    });

    await dataSource.destroy();
    logger.info('Database connection closed. Seed completed.');
  } catch (error) {
    logger.error('Seed script failed.', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    try {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch {
      // Ignore cleanup errors
    }

    process.exit(1);
  }
}

seed();
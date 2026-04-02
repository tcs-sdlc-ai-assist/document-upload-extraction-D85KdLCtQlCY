import { ConfigModule } from '@nestjs/config';

export const AppConfig = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
  cache: true,
  expandVariables: true,
  validate: undefined,
  load: [
    () => ({
      PORT: parseInt(process.env.PORT || '3000', 10),
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',
      MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
      NODE_ENV: process.env.NODE_ENV || 'development',
    }),
  ],
});
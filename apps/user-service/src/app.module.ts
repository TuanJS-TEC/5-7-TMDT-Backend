import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from '@car-marketplace/database';
import { UsersModule } from './users/users.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), '..', '.env'),
        join(process.cwd(), '..', '..', '.env'),
      ],
    }),
    DatabaseModule,
    UsersModule.forRoot(),
  ],
  controllers: [HealthController],
})
export class AppModule {}

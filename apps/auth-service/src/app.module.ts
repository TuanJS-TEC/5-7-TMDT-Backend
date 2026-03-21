import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { OtpModule } from './otp/otp.module';
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
    OtpModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

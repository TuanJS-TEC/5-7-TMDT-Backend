import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { SMS_GATEWAY } from './sms/sms-gateway.interface';
import { MockSmsGateway } from './sms/mock-sms.gateway';
import { UserServiceClient } from './user-service.client';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-otp-secret-change-me'),
        signOptions: {},
      }),
    }),
  ],
  controllers: [OtpController],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService): Redis | null => {
        if (config.get<string>('SKIP_REDIS', 'false') === 'true') {
          return null;
        }
        return new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        });
      },
      inject: [ConfigService],
    },
    { provide: SMS_GATEWAY, useClass: MockSmsGateway },
    UserServiceClient,
    OtpService,
  ],
  exports: [OtpService, UserServiceClient],
})
export class OtpModule {}

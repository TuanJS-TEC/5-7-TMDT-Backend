import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis';
import { OtpModule } from '../otp/otp.module';
import { RegisterService } from './register.service';
import { RegisterController } from './register.controller';

@Module({
  imports: [
    OtpModule,
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
  controllers: [RegisterController],
  providers: [
    RegisterService,
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
  ],
})
export class RegisterModule {}

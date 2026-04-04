import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from '@car-marketplace/database';
import { OtpChallengeOrmEntity } from '../otp/otp-challenge.orm.entity';
import { OtpChallengeService } from '../otp/otp-challenge.service';
import { PhoneOtpFacadeService } from '../otp/phone-otp.facade.service';
import { PasswordResetService } from '../password-reset/password-reset.service';
import { PendingRegistrationOrmEntity } from '../registration/pending-registration.orm.entity';
import { RegisterService } from '../registration/register.service';
import { ProfileController } from '../profile/profile.controller';
import { ProfileService } from '../profile/profile.service';
import { AuthController } from './auth.controller';
import { AuthSessionService } from './auth-session.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { LoginService } from './login.service';
import { SellerGuard } from './seller.guard';
import { SmsNotificationService } from './sms-notification.service';

const typeOrmAuth =
  process.env.SKIP_DATABASE === 'true'
    ? []
    : [
        TypeOrmModule.forFeature([
          UserOrmEntity,
          PendingRegistrationOrmEntity,
          OtpChallengeOrmEntity,
        ]),
      ];

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ...typeOrmAuth,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-change-in-production'),
        signOptions: {
          expiresIn: Number(config.get<string>('JWT_EXPIRES_SEC', '3600')),
        },
      }),
    }),
  ],
  controllers: [AuthController, ProfileController],
  providers: [
    AuthSessionService,
    LoginService,
    RegisterService,
    SmsNotificationService,
    OtpChallengeService,
    PhoneOtpFacadeService,
    PasswordResetService,
    JwtStrategy,
    JwtAuthGuard,
    SellerGuard,
    ProfileService,
  ],
})
export class AuthModule {}

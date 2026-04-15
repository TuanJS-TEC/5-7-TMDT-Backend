import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { DatabaseModule } from '@car-marketplace/database';
import { UsersModule } from './users/users.module';
import { HealthController } from './health.controller';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { IdentityVerificationModule } from './identity-verification/identity-verification.module';

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
    IdentityVerificationModule,
  ],
  // controllers: [HealthController, AppController],
  // providers: [AppService],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}

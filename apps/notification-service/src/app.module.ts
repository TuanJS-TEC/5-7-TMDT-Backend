import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RefundNotificationDispatcher } from './application/refund-notification.dispatcher';
import { AccountLockedDispatcher } from './application/account-locked.dispatcher';
import { SellerWarningDispatcher } from './application/seller-warning.dispatcher';
import { RefundCompletedConsumer } from './infrastructure/messaging/refund-completed.consumer';
import { NotificationsController } from './presentation/notifications.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
  ],
  controllers: [AppController, NotificationsController],
  providers: [
    AppService,
    RefundNotificationDispatcher,
    SellerWarningDispatcher,
    AccountLockedDispatcher,
    RefundCompletedConsumer,
  ],
})
export class AppModule {}

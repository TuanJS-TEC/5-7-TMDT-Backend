import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RefundNotificationDispatcher } from './application/refund-notification.dispatcher';
import { RefundCompletedConsumer } from './infrastructure/messaging/refund-completed.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RefundNotificationDispatcher,
    RefundCompletedConsumer,
  ],
})
export class AppModule {}

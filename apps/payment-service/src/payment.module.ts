import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentAuthModule } from './auth/payment-auth.module';
import { PaymentController } from './presentation/controllers/payment.controller';
import { PaymentAdminController } from './presentation/controllers/payment-admin.controller';
import { PaymentWebhookController } from './presentation/controllers/payment-webhook.controller';
import { GetPaymentMethodsHandler } from './application/queries/get-payment-methods/get-payment-methods.handler';
import { GetPaymentOrderHandler } from './application/queries/get-payment-order/get-payment-order.handler';
import { CreatePaymentOrderHandler } from './application/commands/create-payment-order/create-payment-order.handler';
import { GenerateVietQrHandler } from './application/commands/generate-vietqr/generate-vietqr.handler';
import { InitEWalletHandler } from './application/commands/init-e-wallet/init-e-wallet.handler';
import { InitAtmBankingHandler } from './application/commands/init-atm-banking/init-atm-banking.handler';
import { CreateRefundHandler } from './application/commands/create-refund/create-refund.handler';
import { PaymentReadRepository } from './infrastructure/persistence/read/payment.read.repository';
import { PaymentWriteRepository } from './infrastructure/persistence/write/payment.write.repository';
import { PaymentOrderOrmEntity } from './infrastructure/persistence/typeorm/payment-order.orm.entity';
import { PaymentRefundOrmEntity } from './infrastructure/persistence/typeorm/payment-refund.orm.entity';
import { RefundRepository } from './infrastructure/persistence/refund.repository';
import { VietQrService } from './infrastructure/vietqr/vietqr.service';
import { VietQrWebhookService } from './infrastructure/vietqr/vietqr-webhook.service';
import { WEBHOOK_ANOMALY_STORE } from './infrastructure/vietqr/webhook-anomaly.token';
import type { WebhookAnomalyRecord } from './infrastructure/vietqr/webhook-anomaly.token';
import { PaymentEventPublisher } from './infrastructure/messaging/payment-event.publisher';
import { PaymentOrderCompletionService } from './application/services/payment-order-completion.service';
import { BankReconcileClient } from './infrastructure/bank/bank-reconcile.client';
import { PaymentReconciliationCron } from './infrastructure/scheduling/payment-reconciliation.cron';
import { DemoWalletService } from './infrastructure/wallet/demo-wallet.service';
import { EWalletWebhookService } from './infrastructure/wallet/e-wallet-webhook.service';
import { EWalletIpTrackerService } from './infrastructure/wallet/e-wallet-ip-tracker.service';
import { DemoWalletSandboxController } from './presentation/controllers/demo-wallet-sandbox.controller';
import { DemoAtmGatewayService } from './infrastructure/atm/demo-atm-gateway.service';
import { AtmBankingWebhookService } from './infrastructure/atm/atm-banking-webhook.service';
import { AtmBankingIpTrackerService } from './infrastructure/atm/atm-banking-ip-tracker.service';
import { DemoAtmSandboxController } from './presentation/controllers/demo-atm-sandbox.controller';
import { Uc31PaymentWebhookController } from './presentation/controllers/uc31-payment-webhook.controller';
import { Uc31GatewayWebhookService } from './infrastructure/webhook/uc31-gateway-webhook.service';
import { Uc31WebhookIpTrackerService } from './infrastructure/webhook/uc31-webhook-ip-tracker.service';
import { DemoRefundGatewayService } from './infrastructure/refund/demo-refund-gateway.service';
import { RefundWebhookService } from './infrastructure/refund/refund-webhook.service';
import { RefundCompletionService } from './application/services/refund-completion.service';

const queryHandlers = [GetPaymentMethodsHandler, GetPaymentOrderHandler];
const commandHandlers = [
  CreatePaymentOrderHandler,
  GenerateVietQrHandler,
  InitEWalletHandler,
  InitAtmBankingHandler,
  CreateRefundHandler,
];
const repositories = [
  PaymentReadRepository,
  PaymentWriteRepository,
  RefundRepository,
];

@Module({
  imports: [
    CqrsModule,
    HttpModule,
    PaymentAuthModule,
    TypeOrmModule.forFeature([PaymentOrderOrmEntity, PaymentRefundOrmEntity]),
  ],
  controllers: [
    PaymentController,
    PaymentAdminController,
    PaymentWebhookController,
    Uc31PaymentWebhookController,
    DemoWalletSandboxController,
    DemoAtmSandboxController,
  ],
  providers: [
    {
      provide: WEBHOOK_ANOMALY_STORE,
      useValue: [] as WebhookAnomalyRecord[],
    },
    VietQrService,
    VietQrWebhookService,
    DemoWalletService,
    EWalletIpTrackerService,
    EWalletWebhookService,
    DemoAtmGatewayService,
    AtmBankingIpTrackerService,
    AtmBankingWebhookService,
    Uc31WebhookIpTrackerService,
    Uc31GatewayWebhookService,
    DemoRefundGatewayService,
    RefundWebhookService,
    RefundCompletionService,
    PaymentEventPublisher,
    PaymentOrderCompletionService,
    BankReconcileClient,
    PaymentReconciliationCron,
    ...queryHandlers,
    ...commandHandlers,
    ...repositories,
  ],
})
export class PaymentModule {}

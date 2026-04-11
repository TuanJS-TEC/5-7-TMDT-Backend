import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateRefundCommand } from './create-refund.command';
import { PaymentWriteRepository } from '../../../infrastructure/persistence/write/payment.write.repository';
import { RefundRepository } from '../../../infrastructure/persistence/refund.repository';
import { DemoRefundGatewayService } from '../../../infrastructure/refund/demo-refund-gateway.service';
import { RefundCompletionService } from '../../services/refund-completion.service';

export type CreateRefundResult = {
  refundId: string;
  status: 'success' | 'failed';
  gatewayRefundReference?: string | null;
  errorMessage?: string | null;
};

@CommandHandler(CreateRefundCommand)
export class CreateRefundHandler
  implements ICommandHandler<CreateRefundCommand, CreateRefundResult>
{
  constructor(
    private readonly writeRepo: PaymentWriteRepository,
    private readonly refundRepo: RefundRepository,
    private readonly demoGateway: DemoRefundGatewayService,
    private readonly completion: RefundCompletionService,
  ) {}

  async execute(cmd: CreateRefundCommand): Promise<CreateRefundResult> {
    const order = await this.writeRepo.findById(cmd.paymentOrderId);
    if (!order) {
      throw new BadRequestException({
        code: 'ORDER_NOT_FOUND',
        message: 'Không tìm thấy đơn thanh toán.',
      });
    }
    if (order.status === 'refunded') {
      throw new ConflictException({
        code: 'ORDER_ALREADY_REFUNDED',
        message: 'Đơn đã được hoàn tiền.',
      });
    }
    if (order.status !== 'success') {
      throw new BadRequestException({
        code: 'ORDER_NOT_PAID',
        message: 'Chỉ hoàn tiền khi giao dịch gốc đã thành công (UC34 điều kiện tiên quyết).',
      });
    }
    const txId = order.transactionId?.trim();
    if (!txId) {
      throw new BadRequestException({
        code: 'MISSING_TRANSACTION_ID',
        message: 'Đơn không có mã giao dịch cổng — không thể hoàn tiền.',
      });
    }
    if (cmd.amountVnd !== order.amountVnd) {
      throw new BadRequestException({
        code: 'REFUND_AMOUNT_MISMATCH',
        message: 'Demo: chỉ hỗ trợ hoàn toàn bộ số tiền đơn (amountVnd phải khớp đơn).',
      });
    }

    const existing = await this.refundRepo.findSuccessfulByPaymentOrderId(
      order.id,
    );
    if (existing) {
      throw new ConflictException({
        code: 'REFUND_ALREADY_SUCCESS',
        message: 'Đơn đã có lệnh hoàn tiền thành công.',
      });
    }

    const refundId = randomUUID();
    await this.refundRepo.create({
      id: refundId,
      paymentOrderId: order.id,
      originalTransactionId: txId,
      amountVnd: cmd.amountVnd,
      status: 'pending',
      reason: cmd.reason,
      createdByAdminUserId: cmd.createdByAdminUserId,
      gatewayRefundReference: null,
      errorMessage: null,
    });
    await this.refundRepo.update(refundId, { status: 'processing' });

    const gw = this.demoGateway.submitRefund({
      refundId,
      paymentOrderId: order.id,
      originalTransactionId: txId,
      amountVnd: cmd.amountVnd,
      simulateGatewayReject: cmd.simulateGatewayReject,
    });

    if (gw.ok) {
      await this.completion.applyGatewaySuccess(refundId, gw.gatewayRefundReference);
      return {
        refundId,
        status: 'success',
        gatewayRefundReference: gw.gatewayRefundReference,
        errorMessage: null,
      };
    }
    await this.completion.applyGatewayFailure(refundId, gw.errorMessage);
    return {
      refundId,
      status: 'failed',
      gatewayRefundReference: null,
      errorMessage: gw.errorMessage,
    };
  }
}

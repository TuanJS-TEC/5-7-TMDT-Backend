import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateVietQrCommand } from './generate-vietqr.command';
import { PaymentReadRepository } from '../../../infrastructure/persistence/read/payment.read.repository';
import { PaymentWriteRepository } from '../../../infrastructure/persistence/write/payment.write.repository';
import { VietQrService } from '../../../infrastructure/vietqr/vietqr.service';

export type GenerateVietQrResult = {
  qrImageUrl: string;
  bankName: string;
  bankBin: string;
  accountNoMasked: string;
  accountName: string;
  amountVnd: number;
  transferContent: string;
  expiresAt: string;
  qrTtlSeconds: number;
};

const QR_TTL_MS = 5 * 60 * 1000;

@CommandHandler(GenerateVietQrCommand)
export class GenerateVietQrHandler
  implements ICommandHandler<GenerateVietQrCommand, GenerateVietQrResult>
{
  constructor(
    private readonly readRepo: PaymentReadRepository,
    private readonly writeRepo: PaymentWriteRepository,
    private readonly vietQr: VietQrService,
    private readonly config: ConfigService,
  ) {}

  async execute(command: GenerateVietQrCommand): Promise<GenerateVietQrResult> {
    const order = await this.readRepo.findById(command.orderId);
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Không tìm thấy đơn thanh toán.',
      });
    }
    if (order.userId !== command.userId) {
      throw new ForbiddenException({
        code: 'ORDER_ACCESS_DENIED',
        message: 'Bạn không có quyền truy cập đơn này.',
      });
    }
    if (order.paymentMethod !== 'qr_banking') {
      throw new BadRequestException({
        code: 'PAYMENT_METHOD_NOT_QR',
        message: 'Đơn không dùng phương thức QR Banking (VietQR).',
      });
    }
    if (order.status !== 'pending') {
      throw new BadRequestException({
        code: 'ORDER_NOT_PENDING',
        message: 'Chỉ đơn PENDING mới tạo hoặc làm mới mã QR.',
      });
    }

    const useDemo = this.vietQr.useDemoImage();
    const bankBin = this.config.get<string>('VIETQR_BANK_BIN')?.trim();
    const accountNo = this.config.get<string>('VIETQR_ACCOUNT_NO')?.trim();
    const accountName = this.config.get<string>('VIETQR_ACCOUNT_NAME')?.trim();
    if (!useDemo && (!bankBin || !accountNo || !accountName)) {
      throw new ServiceUnavailableException({
        code: 'VIETQR_NOT_CONFIGURED',
        message: 'Hệ thống chưa cấu hình tài khoản nhận VietQR (VIETQR_*).',
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + QR_TTL_MS);
    let qrImageUrl: string;
    try {
      qrImageUrl = this.vietQr.resolveQrImageUrl({
        orderId: order.id,
        amountVnd: order.amountVnd,
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'VIETQR_BUILD_FAILED',
        message: 'Không tạo được URL VietQR. Kiểm tra biến môi trường.',
      });
    }

    const transferContent = order.id;
    await this.writeRepo.update(order.id, {
      vietQrImageUrl: qrImageUrl,
      vietQrGeneratedAt: now,
      vietQrExpiresAt: expiresAt,
      transferContent,
      updatedAt: now,
    });

    return {
      qrImageUrl,
      bankName: this.vietQr.bankName,
      bankBin: bankBin ?? 'demo',
      accountNoMasked: accountNo ? maskAccountNo(accountNo) : '****demo',
      accountName: accountName ?? 'TAI KHOAN DEMO',
      amountVnd: order.amountVnd,
      transferContent,
      expiresAt: expiresAt.toISOString(),
      qrTtlSeconds: Math.floor(QR_TTL_MS / 1000),
    };
  }
}

function maskAccountNo(accountNo: string): string {
  const digits = accountNo.replace(/\s/g, '');
  if (digits.length <= 4) return '****';
  return `${'*'.repeat(Math.min(8, digits.length - 4))}${digits.slice(-4)}`;
}

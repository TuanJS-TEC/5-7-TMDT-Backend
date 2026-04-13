import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { PaymentOrderRecord } from '../payment-order.record';
import { PaymentOrderOrmEntity } from '../typeorm/payment-order.orm.entity';
import { paymentOrderToRecord } from '../payment-order.mapper';

@Injectable()
export class PaymentReadRepository {
  constructor(
    @InjectRepository(PaymentOrderOrmEntity)
    private readonly repo: Repository<PaymentOrderOrmEntity>,
  ) {}

  async findById(id: string): Promise<PaymentOrderRecord | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? paymentOrderToRecord(e) : null;
  }

  async findByUserId(userId: string): Promise<PaymentOrderRecord[]> {
    const rows = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(paymentOrderToRecord);
  }

  /**
   * UC28 A4 — đơn QR Banking PENDING mà không có webhook sau `minutes` phút
   * (tính từ max(createdAt, vietQrGeneratedAt)).
   */
  async findPendingQrBankingStale(minutes: number): Promise<PaymentOrderRecord[]> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const qb = this.repo
      .createQueryBuilder('o')
      .where('o.status = :st', { st: 'pending' })
      .andWhere('o.paymentMethod = :pm', { pm: 'qr_banking' })
      .andWhere(
        'GREATEST(o.createdAt, COALESCE(o.vietQrGeneratedAt, o.createdAt)) < :cutoff',
        { cutoff },
      );
    const rows = await qb.getMany();
    return rows.map(paymentOrderToRecord);
  }

  /** UC29 — phiên ví hết hạn mà vẫn PENDING */
  async findPendingEWalletSessionExpired(): Promise<PaymentOrderRecord[]> {
    const now = new Date();
    const qb = this.repo
      .createQueryBuilder('o')
      .where('o.status = :st', { st: 'pending' })
      .andWhere('o.paymentMethod IN (:...pm)', { pm: ['momo', 'zalopay'] })
      .andWhere('o.walletSessionExpiresAt IS NOT NULL')
      .andWhere('o.walletSessionExpiresAt < :now', { now });
    const rows = await qb.getMany();
    return rows.map(paymentOrderToRecord);
  }

  /** UC30 A3 — hết phiên cổng ATM/IB mà vẫn PENDING */
  async findPendingAtmSessionExpired(): Promise<PaymentOrderRecord[]> {
    const now = new Date();
    const qb = this.repo
      .createQueryBuilder('o')
      .where('o.status = :st', { st: 'pending' })
      .andWhere('o.paymentMethod = :pm', { pm: 'atm_internet_banking' })
      .andWhere('o.atmSessionExpiresAt IS NOT NULL')
      .andWhere('o.atmSessionExpiresAt < :now', { now });
    const rows = await qb.getMany();
    return rows.map(paymentOrderToRecord);
  }
}

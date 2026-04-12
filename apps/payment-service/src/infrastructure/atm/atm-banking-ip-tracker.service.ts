import { Injectable, Logger } from '@nestjs/common';

/** UC30 — sai secure_hash lặp theo IP (tương tự UC29 A4). */
@Injectable()
export class AtmBankingIpTrackerService {
  private readonly logger = new Logger(AtmBankingIpTrackerService.name);
  private readonly failures = new Map<string, number>();
  private readonly blacklist = new Set<string>();

  isBlacklisted(ip: string): boolean {
    return this.blacklist.has(ip);
  }

  recordInvalidSignature(ip: string): void {
    const n = (this.failures.get(ip) ?? 0) + 1;
    this.failures.set(ip, n);
    this.logger.warn(`UC30: IPN ATM secure_hash sai — IP=${ip} lần ${n}`);
    if (n > 3) {
      this.blacklist.add(ip);
      this.logger.error(`UC30 A4: IP ${ip} bị chặn webhook ATM.`);
    }
  }
}

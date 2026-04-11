import { Injectable, Logger } from '@nestjs/common';

/** UC29 A4 — đếm IPN sai chữ ký theo IP; >3 → blacklist tạm (in-memory). */
@Injectable()
export class EWalletIpTrackerService {
  private readonly logger = new Logger(EWalletIpTrackerService.name);
  private readonly failures = new Map<string, number>();
  private readonly blacklist = new Set<string>();

  isBlacklisted(ip: string): boolean {
    return this.blacklist.has(ip);
  }

  recordInvalidSignature(ip: string): void {
    const n = (this.failures.get(ip) ?? 0) + 1;
    this.failures.set(ip, n);
    this.logger.warn(`SECURITY_WARNING: IPN e-wallet chữ ký sai — IP=${ip} lần ${n}`);
    if (n > 3) {
      this.blacklist.add(ip);
      this.logger.error(
        `UC29 A4: IP ${ip} đã bị chặn webhook e-wallet sau ${n} lần chữ ký không hợp lệ.`,
      );
    }
  }

  resetFailuresForTests(): void {
    this.failures.clear();
    this.blacklist.clear();
  }
}

import { Injectable, Logger } from '@nestjs/common';

/** UC31 A2 — chữ ký sai lặp theo IP (>3 → blacklist). */
@Injectable()
export class Uc31WebhookIpTrackerService {
  private readonly logger = new Logger(Uc31WebhookIpTrackerService.name);
  private readonly failures = new Map<string, number>();
  private readonly blacklist = new Set<string>();

  isBlacklisted(ip: string): boolean {
    return this.blacklist.has(ip);
  }

  recordInvalidSignature(ip: string): void {
    const n = (this.failures.get(ip) ?? 0) + 1;
    this.failures.set(ip, n);
    this.logger.warn(
      `SECURITY_WARNING UC31: signature không khớp — IP=${ip}, attempt=${n}, payload đã log ở handler.`,
    );
    if (n > 3) {
      this.blacklist.add(ip);
      this.logger.error(
        `UC31 A2: IP ${ip} bị blacklist webhook — gửi cảnh báo Admin (bảo mật).`,
      );
    }
  }
}

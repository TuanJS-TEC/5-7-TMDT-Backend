import { Injectable, Logger } from '@nestjs/common';

export interface DeviceRegistration {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  registeredAt: string;
}

@Injectable()
export class DeviceTokenRegistry {
  private readonly logger = new Logger(DeviceTokenRegistry.name);
  private readonly devices = new Map<string, DeviceRegistration>();

  register(dto: DeviceRegistration): DeviceRegistration {
    const key = `${dto.userId}:${dto.platform}:${dto.token}`;
    this.devices.set(key, dto);
    this.logger.log(
      `Registered device ${dto.platform} for user ${dto.userId} (FCM mock — ${this.devices.size} total)`,
    );
    return dto;
  }

  listForUser(userId: string): DeviceRegistration[] {
    return [...this.devices.values()].filter((d) => d.userId === userId);
  }
}

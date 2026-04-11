import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Bảo vệ API nội bộ giữa các service (UC37, …). */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('INTERNAL_API_KEY')?.trim();
    if (!expected) {
      throw new UnauthorizedException({
        code: 'INTERNAL_API_NOT_CONFIGURED',
        message: 'INTERNAL_API_KEY chưa cấu hình trên auth-service.',
      });
    }
    const req = context.switchToHttp().getRequest<{ headers?: Record<string, string> }>();
    const key = req.headers?.['x-internal-api-key'];
    if (typeof key !== 'string' || key !== expected) {
      throw new UnauthorizedException({
        code: 'INVALID_INTERNAL_API_KEY',
        message: 'Khóa API nội bộ không hợp lệ.',
      });
    }
    return true;
  }
}

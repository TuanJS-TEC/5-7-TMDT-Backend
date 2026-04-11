import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { JwtRequestUser } from './jwt-payload.types';

/** UC34 — chỉ Quản trị viên */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException({
        code: 'ADMIN_ONLY',
        message: 'Chỉ quản trị viên mới được thực hiện thao tác này (UC34).',
      });
    }
    return true;
  }
}

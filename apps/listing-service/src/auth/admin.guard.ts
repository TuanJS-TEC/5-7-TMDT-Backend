import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { JwtRequestUser } from '@car-marketplace/common';

/** Dev — chỉ role admin (UC32). */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    if (req.user?.role !== 'admin') {
      throw new ForbiddenException({
        code: 'ADMIN_ONLY',
        message: 'Chỉ quản trị viên mới được thực hiện thao tác này.',
      });
    }
    return true;
  }
}

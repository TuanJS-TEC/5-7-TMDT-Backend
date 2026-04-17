import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtRequestUser } from './jwt-payload.types';

@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    if (!req.user) {
        throw new UnauthorizedException('Người dùng chưa đăng nhập hoặc token không hợp lệ.');
    }
    if (req.user.role !== 'seller' && req.user.role !== 'admin') { // Thêm 'admin' nếu admin cũng có quyền seller
        throw new UnauthorizedException('Bạn không có quyền người bán (seller).');
    }
    return true; // Người dùng là seller hoặc admin
  }
}
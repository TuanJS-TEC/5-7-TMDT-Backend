import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { JwtRequestUser } from './jwt-payload.types';

/** UC28 — thanh toán gói tin: người bán */
@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    return req.user?.role === 'seller';
  }
}

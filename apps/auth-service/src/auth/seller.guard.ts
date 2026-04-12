import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { JwtRequestUser } from './jwt-payload.types';

/** UC15 — chỉ người bán (role seller) */
@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    return req.user?.role === 'seller';
  }
}

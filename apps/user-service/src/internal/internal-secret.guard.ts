import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('INTERNAL_API_SECRET', '');
    if (!secret) {
      throw new UnauthorizedException('INTERNAL_API_SECRET not configured');
    }
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers['x-internal-secret'];
    const value = Array.isArray(header) ? header[0] : header;
    if (value !== secret) {
      throw new UnauthorizedException('Invalid internal secret');
    }
    return true;
  }
}

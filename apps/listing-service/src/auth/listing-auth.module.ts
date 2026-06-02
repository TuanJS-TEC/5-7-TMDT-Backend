import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard, SellerGuard } from '@car-marketplace/common';
import { AdminGuard } from './admin.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [ConfigModule, PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, JwtAuthGuard, SellerGuard, AdminGuard],
  exports: [JwtAuthGuard, SellerGuard, AdminGuard, PassportModule],
})
export class ListingAuthModule {}

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigModule là global để dễ dàng truy cập biến môi trường
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
// export class AppModule {}
export class AppModule implements NestModule { // Thực hiện NestModule
  constructor(private readonly configService: ConfigService) {} // Inject ConfigService

  configure(consumer: MiddlewareConsumer) {
    // Lấy URL của Listing Service từ biến môi trường
    const listingServiceUrl =
      this.configService.get<string>('LISTING_SERVICE_URL') ??
      'http://localhost:3001';

    consumer
      .apply(
        createProxyMiddleware({
          target: listingServiceUrl,
          changeOrigin: true,
          pathRewrite: {
            '^/api/v1/listings': '/v1/listings', 
          },
          // Không cần onProxyReq cho JWT Guard ở đây vì UC1-4 là public
          // onProxyReq: (proxyReq, req, res) => { /* logic JWT forwarding */ },
        }),
      )
      .forRoutes('/api/v1/listings*'); // Áp dụng cho tất cả các request bắt đầu bằng /api/v1/listings

    // Thêm proxy cho Auth Service (cần cho UC4 để lấy thông tin người bán)
    const authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ??
      'http://localhost:3002';

    consumer
      .apply(
        createProxyMiddleware({
          target: authServiceUrl,
          changeOrigin: true,
          pathRewrite: {
            '^/api/v1/auth': '/v1/auth',
          },
        }),
      )
      .forRoutes('/api/v1/auth*');
  }
}
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ConfigModule là global để dễ dàng truy cập biến môi trường
      ignoreEnvFile: process.env.NODE_ENV === 'production',
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
      'http://localhost:3002';

    consumer
      .apply(
        createProxyMiddleware({
          target: listingServiceUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          },
          // Listing service dùng setGlobalPrefix('api') + URI v1 → /api/v1/listings (không phải /v1/listings)
        }),
      )
      // Không thêm prefix /api ở đây — setGlobalPrefix('api') đã có; *path thay cho * (path-to-regexp v8+)
      .forRoutes(
        {
          path: 'listings',
          method: RequestMethod.ALL,
          version: '1',
        },
        {
          path: 'listings/*path',
          method: RequestMethod.ALL,
          version: '1',
        },
      );

    // Proxy static listing images: /uploads/listings/... -> listing-service
    consumer
      .apply(
        createProxyMiddleware({
          target: listingServiceUrl,
          changeOrigin: true,
        }),
      )
      .forRoutes({
        path: 'uploads/listings/*path',
        method: RequestMethod.ALL,
      });

    // Thêm proxy cho Auth Service (cần cho UC4 để lấy thông tin người bán)
    const authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ??
      'http://localhost:3001';

    consumer
      .apply(
        createProxyMiddleware({
          target: authServiceUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          },
        }),
      )
      .forRoutes(
        {
          path: 'auth',
          method: RequestMethod.ALL,
          version: '1',
        },
        {
          path: 'auth/*path',
          method: RequestMethod.ALL,
          version: '1',
        },
      );

    // Proxy static avatar images: /uploads/avatars/... -> auth-service
    consumer
      .apply(
        createProxyMiddleware({
          target: authServiceUrl,
          changeOrigin: true,
        }),
      )
      .forRoutes({
        path: 'uploads/avatars/*path',
        method: RequestMethod.ALL,
      });

    const paymentServiceUrl =
      this.configService.get<string>('PAYMENT_SERVICE_URL') ??
      'http://localhost:3004';

    consumer
      .apply(
        createProxyMiddleware({
          target: paymentServiceUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          },
        }),
      )
      .forRoutes(
        {
          path: 'payments',
          method: RequestMethod.ALL,
          version: '1',
        },
        {
          path: 'payments/*path',
          method: RequestMethod.ALL,
          version: '1',
        },
      );

    // UC31 — webhook thống nhất: /api/v1/payment/webhook
    consumer
      .apply(
        createProxyMiddleware({
          target: paymentServiceUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          },
        }),
      )
      .forRoutes(
        {
          path: 'payment',
          method: RequestMethod.ALL,
          version: '1',
        },
        {
          path: 'payment/*path',
          method: RequestMethod.ALL,
          version: '1',
        },
      );

    const adminServiceUrl =
      this.configService.get<string>('ADMIN_SERVICE_URL') ??
      'http://localhost:3006';

    consumer
      .apply(
        createProxyMiddleware({
          target: adminServiceUrl,
          changeOrigin: true,
          on: {
            proxyReq: fixRequestBody,
          },
        }),
      )
      .forRoutes(
        {
          path: 'admin',
          method: RequestMethod.ALL,
          version: '1',
        },
        {
          path: 'admin/*path',
          method: RequestMethod.ALL,
          version: '1',
        },
      );
  }
}
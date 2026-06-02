import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const listingServiceUrl =
    process.env.LISTING_SERVICE_URL ?? 'http://localhost:3002';
  const authServiceUrl =
    process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';

  // Ảnh upload nằm ngoài prefix /api — proxy trực tiếp ở Express (Nest middleware bị gắn /api)
  app.use(
    createProxyMiddleware({
      target: listingServiceUrl,
      changeOrigin: true,
      pathFilter: '/uploads/listings',
    }),
  );
  app.use(
    createProxyMiddleware({
      target: authServiceUrl,
      changeOrigin: true,
      pathFilter: '/uploads/avatars',
    }),
  );

  // Thêm global prefix và versioning
  app.setGlobalPrefix('api'); // Tất cả các route sẽ bắt đầu với /api
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  // Cấu hình CORS cơ bản cho dev
  app.enableCors({
    origin: '*', // Trong production, thay thế bằng domain frontend cụ thể
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // GET / — không nằm dưới prefix /api; tránh 404 khi mở trực tiếp http://localhost:3000/
  app.getHttpAdapter().get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      service: 'car-marketplace-api-gateway',
      message: 'Dùng các route dưới /api/v1/... (ví dụ GET /api/v1/listings).',
    });
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`API Gateway is running on: ${await app.getUrl()}`);
}
bootstrap();

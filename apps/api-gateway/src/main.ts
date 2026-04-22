import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';
import type { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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

  await app.listen(process.env.PORT ?? 3000);
  console.log(`API Gateway is running on: ${await app.getUrl()}`);
}
bootstrap();

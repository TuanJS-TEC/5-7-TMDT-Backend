import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API Gateway is running on: ${await app.getUrl()}`);
}
bootstrap();

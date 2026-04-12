import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SMS_GATEWAY } from './../src/otp/sms/sms-gateway.interface';
import type { SmsGateway } from './../src/otp/sms/sms-gateway.interface';
import { AuthController } from './../src/auth/auth.controller';
import { LoginService } from './../src/auth/login.service';

describe('Auth Service (e2e)', () => {
  describe('Auth OTP (e2e)', () => {
    let app: INestApplication<App>;
    let lastOtp: string | null = null;

    const capturingSms: SmsGateway = {
      sendOtp: async (_phone: string, message: string) => {
        const m = message.match(/(\d{6})/);
        lastOtp = m ? m[1] : null;
        return true;
      },
    };

    beforeEach(async () => {
      lastOtp = null;
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(SMS_GATEWAY)
        .useValue(capturingSms)
        .compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api');
      app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
      });
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      await app.init();
    });

    afterEach(async () => {
      await app?.close();
    });

    it('GET /api/health', () => {
      return request(app.getHttpServer()).get('/api/health').expect(200);
    });

    it('POST /api/v1/otp/send then verify success', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/otp/send')
        .send({ phone: '0912345678', purpose: 'register' })
        .expect(201);

      expect(lastOtp).toMatch(/^\d{6}$/);

      const res = await request(app.getHttpServer())
        .post('/api/v1/otp/verify')
        .send({ phone: '0912345678', code: lastOtp })
        .expect(201);

      expect(res.body.verificationToken).toBeDefined();
    });

    it('POST /api/v1/otp/verify wrong code returns OTP_MISMATCH', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/otp/send')
        .send({ phone: '0987654321', purpose: 'register' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/otp/verify')
        .send({ phone: '0987654321', code: '000000' })
        .expect(400);

      const payload =
        typeof res.body.message === 'object' && res.body.message !== null
          ? res.body.message
          : res.body;
      expect((payload as { code?: string }).code).toBe('OTP_MISMATCH');
      expect((payload as { remainingAttempts?: number }).remainingAttempts).toBe(
        2,
      );
    });
  });

  describe('Auth login (e2e)', () => {
    let app: INestApplication<App>;
    const loginMock = { login: jest.fn() };

    beforeEach(async () => {
      loginMock.login.mockReset();

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
          }),
        ],
        controllers: [AuthController],
        providers: [{ provide: LoginService, useValue: loginMock }],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api');
      app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
      });
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      await app.init();
    });

    afterEach(async () => {
      await app?.close();
    });

    it('POST /api/v1/auth/login rejects invalid phone format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ phone: '123', password: 'x' })
        .expect(400);
      expect(loginMock.login).not.toHaveBeenCalled();
    });

    it('POST /api/v1/auth/login delegates to LoginService when body valid', async () => {
      loginMock.login.mockResolvedValue({
        accessToken: 't',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { id: 'u1', phone: '0901234567', role: 'buyer' },
        redirectPath: '/',
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('User-Agent', 'jest')
        .send({ phone: '0901234567', password: 'secret' })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBe('t');
          expect(res.body.redirectPath).toBe('/');
        });

      expect(loginMock.login).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '0901234567', password: 'secret' }),
        'jest',
      );
    });
  });
});


import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from './../src/auth/auth.controller';
import { LoginService } from './../src/auth/login.service';

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

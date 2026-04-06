/// <reference types="jest" />

import { INestApplication } from '@nestjs/common';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Identity Verification Mock (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('submit request -> pending -> admin approve -> can sell', async () => {
    const submitRes = await request(app.getHttpServer())
      .post('/identity-verification/requests')
      .send({
        userId: 'u_buyer_001',
        documentType: 'cccd',
        idImageUrl: 'https://mock-storage.local/id/u_buyer_001_cccd.jpg',
      })
      .expect(201);

    expect(submitRes.body.data.aiCheckStatus).toBe('passed');
    expect(submitRes.body.data.status).toBe('pending_admin_review');

    const requestId = submitRes.body.data.id as string;

    await request(app.getHttpServer())
      .get('/identity-verification/users/u_buyer_001/can-sell')
      .expect(200)
      .expect((res) => {
        expect(res.body.canSell).toBe(false);
        expect(res.body.verificationStatus).toBe('pending_admin_review');
      });

    await request(app.getHttpServer())
      .get('/identity-verification/admin/requests?status=pending_admin_review')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.some((item: { id: string }) => item.id === requestId)).toBe(true);
      });

    await request(app.getHttpServer())
      .patch(`/identity-verification/admin/requests/${requestId}/approve`)
      .send({
        adminId: 'admin_001',
        note: 'Ho so hop le',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('approved');
      });

    await request(app.getHttpServer())
      .get('/identity-verification/users/u_buyer_001/can-sell')
      .expect(200)
      .expect((res) => {
        expect(res.body.canSell).toBe(true);
        expect(res.body.verificationStatus).toBe('approved');
      });
  });

  it('submit request -> admin reject -> cannot sell', async () => {
    const submitRes = await request(app.getHttpServer())
      .post('/identity-verification/requests')
      .send({
        userId: 'u_buyer_002',
        documentType: 'cmnd',
        idImageUrl: 'https://mock-storage.local/id/u_buyer_002_cmnd.jpg',
      })
      .expect(201);

    const requestId = submitRes.body.data.id as string;

    await request(app.getHttpServer())
      .patch(`/identity-verification/admin/requests/${requestId}/reject`)
      .send({
        adminId: 'admin_002',
        reason: 'Anh mo, thong tin khong ro rang',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.status).toBe('rejected');
      });

    await request(app.getHttpServer())
      .get('/identity-verification/users/u_buyer_002/can-sell')
      .expect(200)
      .expect((res) => {
        expect(res.body.canSell).toBe(false);
        expect(res.body.verificationStatus).toBe('rejected');
      });
  });
});

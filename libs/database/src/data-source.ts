import 'reflect-metadata';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { UserOrmEntity } from './entities/user.orm.entity';
import { PaymentOrderOrmEntity } from './entities/payment-order.orm.entity';
import { PaymentRefundOrmEntity } from './entities/payment-refund.orm.entity';

dotenvConfig({ path: resolve(process.cwd(), '.env') });
dotenvConfig({ path: resolve(process.cwd(), '..', '..', '.env') });

function envString(name: string, fallback: string): string {
  const value = process.env[name];
  return typeof value === 'string' ? value : fallback;
}

const port = parseInt(envString('POSTGRES_PORT', '5432'), 10);

export default new DataSource({
  type: 'postgres',
  host: envString('POSTGRES_HOST', 'localhost'),
  port,
  username: envString('POSTGRES_USER', 'postgres'),
  password: envString('POSTGRES_PASSWORD', ''),
  database: envString('POSTGRES_DB', 'car_marketplace'),
  entities: [UserOrmEntity, PaymentOrderOrmEntity, PaymentRefundOrmEntity],
  migrations: ['src/migrations/*.ts', 'dist/migrations/*.js'],
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});

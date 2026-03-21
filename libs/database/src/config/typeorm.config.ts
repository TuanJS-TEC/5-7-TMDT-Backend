import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function typeOrmModuleOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('POSTGRES_HOST', 'localhost'),
    port: parseInt(config.get<string>('POSTGRES_PORT', '5432'), 10),
    username: config.get<string>('POSTGRES_USER', 'postgres'),
    password: config.get<string>('POSTGRES_PASSWORD', ''),
    database: config.get<string>('POSTGRES_DB', 'car_marketplace'),
    autoLoadEntities: true,
    synchronize: config.get<string>('TYPEORM_SYNC', 'false') === 'true',
    logging: config.get<string>('TYPEORM_LOGGING', 'false') === 'true',
  };
}

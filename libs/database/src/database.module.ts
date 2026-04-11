import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmModuleOptions } from './config/typeorm.config';

function useDatabase(): boolean {
  return process.env.SKIP_DATABASE?.trim() !== 'true';
}

@Module({
  imports: useDatabase()
    ? [
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => typeOrmModuleOptions(config),
        }),
      ]
    : [],
})
export class DatabaseModule {}

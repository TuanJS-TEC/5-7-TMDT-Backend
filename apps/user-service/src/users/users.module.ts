import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { UsersService } from './users.service';
import { NoopUsersService } from './noop-users.service';
import { InternalPhoneController } from '../internal/internal-phone.controller';
import { InternalUsersController } from '../internal/internal-users.controller';

function skipDatabase(): boolean {
  return process.env.SKIP_DATABASE === 'true';
}

@Module({})
export class UsersModule {
  static forRoot(): DynamicModule {
    const skip = skipDatabase();
    return {
      module: UsersModule,
      imports: skip ? [] : [TypeOrmModule.forFeature([UserEntity])],
      controllers: [InternalPhoneController, InternalUsersController],
      providers: skip
        ? [
            NoopUsersService,
            { provide: 'PHONE_MARKER', useExisting: NoopUsersService },
            { provide: 'USERS_API', useExisting: NoopUsersService },
          ]
        : [
            UsersService,
            { provide: 'PHONE_MARKER', useExisting: UsersService },
            { provide: 'USERS_API', useExisting: UsersService },
          ],
    };
  }
}

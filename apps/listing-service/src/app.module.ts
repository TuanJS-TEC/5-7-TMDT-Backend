import { Module } from '@nestjs/common';
import { ListingModule } from './listing.module';

@Module({
  imports: [ListingModule],
})
export class AppModule {}

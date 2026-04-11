import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetListingPackagesQuery } from './get-listing-packages.query';
import {
  LISTING_PACKAGES,
  type ListingPackageInfo,
} from '../../../domain/value-objects/listing-package.value-object';

/** UC18 — Trả về danh sách tất cả các gói đăng tin */
@QueryHandler(GetListingPackagesQuery)
export class GetListingPackagesHandler
  implements IQueryHandler<GetListingPackagesQuery>
{
  async execute(_query: GetListingPackagesQuery): Promise<ListingPackageInfo[]> {
    return LISTING_PACKAGES;
  }
}

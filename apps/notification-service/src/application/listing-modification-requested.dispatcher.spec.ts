import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LISTING_EVENTS } from '@car-marketplace/messaging';
import { ListingModificationRequestedDispatcher } from './listing-modification-requested.dispatcher';

describe('ListingModificationRequestedDispatcher', () => {
  let dispatcher: ListingModificationRequestedDispatcher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingModificationRequestedDispatcher,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'NOTIFICATION_LISTING_MODIFICATION_CHANNEL_ORDER') {
                return 'in_app';
              }
              return undefined;
            },
          },
        },
      ],
    }).compile();

    dispatcher = module.get(ListingModificationRequestedDispatcher);
  });

  it('exports UC33 queue name in messaging lib', () => {
    expect(LISTING_EVENTS.MODIFICATION_REQUESTED).toBe(
      'listing.modification_requested',
    );
  });

  it('gửi thông báo in-app thành công', async () => {
    const result = await dispatcher.dispatchModificationRequested({
      recipientUserId: 'seller-1',
      listingId: 'listing-1',
      details: 'Can bo sung anh ngoai that ro hon',
      requestedAt: '2026-05-25T10:00:00.000Z',
    });

    expect(result.success).toBe(true);
    expect(result.deliveredChannel).toBe('in_app');
    expect(result.primaryChannel).toBe('in_app');
  });

  it('dispatchFromEvent dùng sellerId từ payload', async () => {
    const result = await dispatcher.dispatchFromEvent({
      listingId: 'listing-2',
      sellerId: 'seller-2',
      moderatorId: 'admin-1',
      details: 'Cap nhat gia cho dung thuc te',
      requestedAt: '2026-05-25T11:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });
});

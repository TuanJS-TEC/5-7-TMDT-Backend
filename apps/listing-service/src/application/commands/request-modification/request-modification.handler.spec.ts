import { BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { RequestModificationHandler } from './request-modification.handler';
import { RequestModificationCommand } from './request-modification.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { ListingModificationRequestedEvent } from '../../events/listing-modification-requested/listing-modification-requested.event';

describe('RequestModificationHandler', () => {
  let handler: RequestModificationHandler;
  let writeRepo: jest.Mocked<Pick<ListingWriteRepository, 'findById' | 'requestModification'>>;
  let eventBus: jest.Mocked<Pick<EventBus, 'publish'>>;

  beforeEach(() => {
    writeRepo = {
      findById: jest.fn(),
      requestModification: jest.fn().mockResolvedValue(undefined),
    };
    eventBus = { publish: jest.fn() };
    handler = new RequestModificationHandler(
      writeRepo as unknown as ListingWriteRepository,
      eventBus as unknown as EventBus,
    );
  });

  it('yêu cầu chỉnh sửa khi tin đang pending', async () => {
    writeRepo.findById.mockResolvedValue({
      id: 'listing-1',
      sellerId: 'seller-1',
      status: 'pending',
    } as Awaited<ReturnType<ListingWriteRepository['findById']>>);

    const result = await handler.execute(
      new RequestModificationCommand('listing-1', 'mod-1', '  Can bo sung anh noi that  '),
    );

    expect(writeRepo.requestModification).toHaveBeenCalledWith(
      'listing-1',
      'mod-1',
      'Can bo sung anh noi that',
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ListingModificationRequestedEvent),
    );
    expect(result).toEqual({
      listingId: 'listing-1',
      status: 'modification_requested',
      details: 'Can bo sung anh noi that',
    });
  });

  it('từ chối khi tin không ở trạng thái pending', async () => {
    writeRepo.findById.mockResolvedValue({
      id: 'listing-1',
      sellerId: 'seller-1',
      status: 'approved',
    } as Awaited<ReturnType<ListingWriteRepository['findById']>>);

    await expect(
      handler.execute(
        new RequestModificationCommand('listing-1', 'mod-1', 'Can sua lai tieu de'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(writeRepo.requestModification).not.toHaveBeenCalled();
  });

  it('báo lỗi khi không tìm thấy tin', async () => {
    writeRepo.findById.mockResolvedValue(undefined);

    await expect(
      handler.execute(
        new RequestModificationCommand('missing', 'mod-1', 'Can sua lai tieu de'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

import { BadRequestException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { RequestModificationCommand } from './request-modification.command';
import { ListingModificationRequestedEvent } from '../../events/listing-modification-requested/listing-modification-requested.event';

@CommandHandler(RequestModificationCommand)
export class RequestModificationHandler
  implements ICommandHandler<RequestModificationCommand>
{
  constructor(
    private readonly writeRepo: ListingWriteRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RequestModificationCommand): Promise<{
    listingId: string;
    status: 'modification_requested';
    details: string;
  }> {
    const existing = await this.writeRepo.findById(command.id);
    if (!existing) {
      throw new BadRequestException('Listing not found');
    }

    if (existing.status !== 'pending') {
      throw new BadRequestException(
        `Chi duoc yeu cau sua voi tin dang dang o trang thai pending (hien tai: ${existing.status})`,
      );
    }

    const normalizedDetails = command.details.trim();
    await this.writeRepo.requestModification(
      command.id,
      command.moderatorId,
      normalizedDetails,
    );

    this.eventBus.publish(
      new ListingModificationRequestedEvent(
        existing.id,
        existing.sellerId,
        command.moderatorId,
        normalizedDetails,
        new Date(),
      ),
    );

    return {
      listingId: existing.id,
      status: 'modification_requested',
      details: normalizedDetails,
    };
  }
}

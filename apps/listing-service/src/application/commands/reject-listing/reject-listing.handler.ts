import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { RejectListingCommand } from './reject-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { ListingRejectedEvent } from '../../events/listing-rejected/listing-rejected.event';

@CommandHandler(RejectListingCommand)
export class RejectListingHandler
  implements ICommandHandler<RejectListingCommand>
{
  constructor(
    private readonly writeRepo: ListingWriteRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RejectListingCommand): Promise<void> {
    const existing = await this.writeRepo.findById(command.id);
    if (!existing) {
      throw new BadRequestException('Listing not found');
    }
    if (existing.status === 'approved' || existing.status === 'sold') {
      throw new BadRequestException(
        `Cannot reject a listing with status "${existing.status}"`,
      );
    }
    await this.writeRepo.reject(command.id, command.reason);
    this.eventBus.publish(
      new ListingRejectedEvent(
        existing.id,
        existing.sellerId,
        command.moderatorId,
        command.reason,
        new Date(),
      ),
    );
  }
}

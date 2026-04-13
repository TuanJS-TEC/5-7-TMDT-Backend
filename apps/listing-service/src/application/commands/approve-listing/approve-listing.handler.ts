import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { ApproveListingCommand } from './approve-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { ListingApprovedEvent } from '../../events/listing-approved/listing-approved.event';

@CommandHandler(ApproveListingCommand)
export class ApproveListingHandler
  implements ICommandHandler<ApproveListingCommand>
{
  constructor(
    private readonly writeRepo: ListingWriteRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApproveListingCommand): Promise<{
    listingId: string;
    status: 'active';
    internalStatus: 'approved';
  }> {
    const existing = await this.writeRepo.findById(command.id);
    if (!existing) {
      throw new BadRequestException('Listing not found');
    }

    if (existing.status !== 'pending') {
      throw new BadRequestException(
        `Chi duoc duyet tin dang dang o trang thai pending (hien tai: ${existing.status})`,
      );
    }

    await this.writeRepo.approve(command.id);
    const updated = await this.writeRepo.findById(command.id);
    if (!updated) {
      throw new BadRequestException('Khong the cap nhat trang thai tin dang');
    }
    this.eventBus.publish(
      new ListingApprovedEvent(
        updated.id,
        command.moderatorId,
        updated.approvedAt ?? new Date(),
      ),
    );

    return {
      listingId: updated.id,
      status: 'active',
      internalStatus: 'approved',
    };
  }
}

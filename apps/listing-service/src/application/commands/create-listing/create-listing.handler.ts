import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { CreateListingCommand } from './create-listing.command';
import { ListingWriteRepository } from '../../../infrastructure/persistence/write/listing.write.repository';
import { ListingCreatedEvent } from '../../events/listing-created/listing-created.event';

@CommandHandler(CreateListingCommand)
export class CreateListingHandler
  implements ICommandHandler<CreateListingCommand>
{
  constructor(
    private readonly writeRepo: ListingWriteRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateListingCommand): Promise<{ id: string }> {
    const id = uuidv4();
    const now = new Date();
    const listing = await this.writeRepo.create({
      id,
      title: command.title,
      description: command.description,
      priceVnd: command.priceVnd,
      sellerId: command.sellerId,
      packageType: command.packageType,
      imageUrls: command.imageUrls,
      carMake: command.carMake,
      carModel: command.carModel,
      carYear: command.carYear,
      mileageKm: command.mileageKm,
      fuelType: command.fuelType,
      transmission: command.transmission,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    this.eventBus.publish(
      new ListingCreatedEvent(
        listing.id,
        listing.sellerId,
        listing.title,
        listing.packageType,
        listing.createdAt,
      ),
    );
    return { id: listing.id };
  }
}

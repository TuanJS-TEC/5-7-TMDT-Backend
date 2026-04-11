import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveFavoriteCommand } from './remove-favorite.command';
import { FavoriteWriteRepository } from '../../../infrastructure/persistence/write/favorite.write.repository';

@CommandHandler(RemoveFavoriteCommand)
export class RemoveFavoriteHandler implements ICommandHandler<RemoveFavoriteCommand> {
  constructor(private readonly writeRepo: FavoriteWriteRepository) {}

  async execute(command: RemoveFavoriteCommand): Promise<void> {
    await this.writeRepo.removeFavorite(command.userId, command.listingId);
  }
}

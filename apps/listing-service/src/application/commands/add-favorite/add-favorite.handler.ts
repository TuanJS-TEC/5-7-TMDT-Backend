import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddFavoriteCommand } from './add-favorite.command';
import { FavoriteWriteRepository } from '../../../infrastructure/persistence/write/favorite.write.repository';

@CommandHandler(AddFavoriteCommand)
export class AddFavoriteHandler implements ICommandHandler<AddFavoriteCommand> {
  constructor(private readonly writeRepo: FavoriteWriteRepository) {}

  async execute(command: AddFavoriteCommand): Promise<void> {
    await this.writeRepo.addFavorite(command.userId, command.listingId);
  }
}

export class ApproveListingCommand {
  constructor(
    public readonly id: string,
    public readonly moderatorId: string,
  ) {}
}

/** UC16 A1 — Admin từ chối / huỷ bài đăng */
export class RejectListingCommand {
  constructor(
    public readonly id: string,
    public readonly moderatorId: string,
    public readonly reason: string,
  ) {}
}

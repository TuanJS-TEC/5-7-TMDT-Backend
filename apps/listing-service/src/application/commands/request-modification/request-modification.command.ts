/** UC33 — yêu cầu người bán chỉnh sửa tin */
export class RequestModificationCommand {
  constructor(
    public readonly id: string,
    public readonly moderatorId: string,
    public readonly details: string,
  ) {}
}

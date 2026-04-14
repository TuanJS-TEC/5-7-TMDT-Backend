export class CreateRefundCommand {
  constructor(
    public readonly paymentOrderId: string,
    public readonly amountVnd: number,
    public readonly reason: string | null,
    public readonly createdByAdminUserId: string,
    /** Demo UC34 A1 — mô phỏng cổng từ chối hoàn tiền */
    public readonly simulateGatewayReject: boolean,
  ) {}
}

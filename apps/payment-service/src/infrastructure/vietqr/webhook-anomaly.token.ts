export const WEBHOOK_ANOMALY_STORE = Symbol('WEBHOOK_ANOMALY_STORE');

export type WebhookAnomalyRecord = {
  id: string;
  receivedAt: Date;
  kind: string;
  orderId: string;
  payload: unknown;
  note: string;
};

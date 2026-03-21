export abstract class BaseIntegrationEvent {
  abstract readonly eventName: string;
  readonly occurredAt: Date = new Date();
}

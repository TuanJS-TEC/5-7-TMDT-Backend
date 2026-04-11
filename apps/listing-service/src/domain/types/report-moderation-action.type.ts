export const REPORT_MODERATION_ACTIONS = [
  'warn_account',
  'lock_account',
  'remove_all_listings',
  'ignore',
] as const;

export type ReportModerationAction =
  (typeof REPORT_MODERATION_ACTIONS)[number];

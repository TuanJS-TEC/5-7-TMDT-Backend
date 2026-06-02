import { LISTING_EVENTS } from './index';

describe('LISTING_EVENTS', () => {
  it('khai báo UC33 modification_requested', () => {
    expect(LISTING_EVENTS.MODIFICATION_REQUESTED).toBe(
      'listing.modification_requested',
    );
  });
});

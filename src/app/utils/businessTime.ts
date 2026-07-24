// Booking/session times (bookingDate + startTime "HH:mm") are entered and read
// as the business's local wall-clock time (Africa/Dakar, UTC+0, no DST) but
// stored/compared using UTC field accessors (see booking.service.ts). Any "now"
// used to decide whether a session is active/upcoming/today must therefore be
// shifted by the same fixed offset instead of using true UTC — otherwise every
// comparison is off by the timezone gap. Dakar is UTC+0, so the offset is 0;
// change this single constant if the business relocates to another timezone.
const BUSINESS_UTC_OFFSET_MINUTES = 0;

/** Current instant, shifted so its UTC getters read as business-local wall-clock time. */
export const getBusinessNow = (): Date =>
  new Date(Date.now() + BUSINESS_UTC_OFFSET_MINUTES * 60_000);

/** Business-local calendar day boundaries (as real Date instants) containing `at`. */
export const getBusinessDayRange = (at: Date = getBusinessNow()): { start: Date; end: Date } => ({
  start: new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 0, 0, 0, 0)),
  end: new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate(), 23, 59, 59, 999)),
});

/** Business-local calendar date as YYYY-MM-DD. */
export const getBusinessDateString = (at: Date = getBusinessNow()): string =>
  at.toISOString().split('T')[0];

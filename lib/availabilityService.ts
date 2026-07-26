/**
 * Centralized Room Availability Service
 * 
 * Single source of truth for all room availability calculations across the platform.
 * 
 * RULE: A room is unavailable ONLY if there exists an ACTIVE booking whose dates overlap
 * the requested stay.
 * 
 * OVERLAP DETECTION:
 * Room is unavailable if:
 *   existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
 * 
 * BLOCKING STATUSES (only these block availability):
 * - CONFIRMED: Booking is confirmed
 * - CHECKED_IN: Guest is checked in
 * - PENDING: Pending payment (blocks to prevent double-booking)
 * 
 * NON-BLOCKING STATUSES (these do NOT block availability):
 * - CANCELLED: Booking was cancelled
 * - CHECKED_OUT: Guest has checked out
 */

export interface BookingInfo {
  id: number;
  checkIn: string | Date;
  checkOut: string | Date;
  status: string;
}

export interface AvailabilityCheckResult {
  available: boolean;
  conflictingBookingId?: number;
  reason?: string;
}

/**
 * Normalize dates to Date objects for comparison
 */
function normalizeDate(date: string | Date): Date {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const parsed = new Date(date);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Check if two date ranges overlap
 * 
 * @param existingCheckIn Start of existing booking
 * @param existingCheckOut End of existing booking (exclusive - room is free this day)
 * @param requestedCheckIn Start of requested stay
 * @param requestedCheckOut End of requested stay (exclusive - room is free this day)
 * 
 * @returns true if ranges overlap
 * 
 * EXAMPLES:
 * - Existing: Jul 26 → Jul 29, Requested: Aug 1 → Aug 2 = NO OVERLAP (available)
 * - Existing: Jul 26 → Jul 29, Requested: Jul 27 → Jul 28 = OVERLAP (unavailable)
 * - Existing: Jul 26 → Jul 29, Requested: Jul 29 → Jul 30 = NO OVERLAP (available, checkout frees room)
 * - Existing: Jul 26 → Jul 29, Requested: Jul 25 → Jul 26 = NO OVERLAP (available, checkin same as checkout)
 */
export function checkDatesOverlap(
  existingCheckIn: Date,
  existingCheckOut: Date,
  requestedCheckIn: Date,
  requestedCheckOut: Date
): boolean {
  // Overlap exists if:
  // existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
  return existingCheckIn < requestedCheckOut && existingCheckOut > requestedCheckIn;
}

/**
 * Check if a booking status blocks availability
 */
function isBlockingStatus(status: string): boolean {
  const blockingStatuses = ['CONFIRMED', 'CHECKED_IN', 'PENDING'];
  return blockingStatuses.includes(status.toUpperCase());
}

/**
 * Check room availability against a list of bookings
 * This is the core function used by all components
 * 
 * @param bookings Array of existing bookings for the room
 * @param requestedCheckIn Requested check-in date (YYYY-MM-DD or Date)
 * @param requestedCheckOut Requested check-out date (YYYY-MM-DD or Date)
 * 
 * @returns AvailabilityCheckResult with available flag and conflict details if unavailable
 */
export function checkRoomAvailability(
  bookings: BookingInfo[],
  requestedCheckIn: string | Date,
  requestedCheckOut: string | Date
): AvailabilityCheckResult {
  // Normalize requested dates
  const reqCheckIn = normalizeDate(requestedCheckIn);
  const reqCheckOut = normalizeDate(requestedCheckOut);

  // Validate dates
  if (reqCheckOut <= reqCheckIn) {
    return {
      available: false,
      reason: 'Check-out date must be after check-in date',
    };
  }

  // Check each booking for conflicts
  for (const booking of bookings) {
    // Skip non-blocking statuses
    if (!isBlockingStatus(booking.status)) {
      continue;
    }

    const existingCheckIn = normalizeDate(booking.checkIn);
    const existingCheckOut = normalizeDate(booking.checkOut);

    // Check for overlap
    if (checkDatesOverlap(existingCheckIn, existingCheckOut, reqCheckIn, reqCheckOut)) {
      return {
        available: false,
        conflictingBookingId: booking.id,
        reason: `This room has a confirmed booking from ${existingCheckIn.toISOString().split('T')[0]} to ${existingCheckOut.toISOString().split('T')[0]}`,
      };
    }
  }

  return { available: true };
}

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkInStr: string | Date, checkOutStr: string | Date): number {
  const checkIn = normalizeDate(checkInStr);
  const checkOut = normalizeDate(checkOutStr);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Get a human-readable explanation of availability
 */
export function getAvailabilityExplanation(result: AvailabilityCheckResult): string {
  if (result.available) {
    return 'This room is available for your selected dates.';
  }
  return result.reason || 'This room is not available for the selected dates.';
}

/**
 * Validate availability and throw if unavailable
 */
export function assertRoomAvailable(
  bookings: BookingInfo[],
  requestedCheckIn: string | Date,
  requestedCheckOut: string | Date
): void {
  const result = checkRoomAvailability(bookings, requestedCheckIn, requestedCheckOut);
  if (!result.available) {
    throw new Error(result.reason || 'Room is not available for selected dates');
  }
}

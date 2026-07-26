from datetime import date

from hotel_management.bookings.models import RoomBooking

from .exceptions import InvalidBookingDates, RoomUnavailable


def validate_booking_dates(check_in: date, check_out: date):
    """
    Validates booking dates.
    Rules:
    - check-in cannot be None
    - check-out cannot be None
    - check-out must be after check-in
    Raises:
        InvalidBookingDates
    """
    if check_in is None or check_out is None:
        raise InvalidBookingDates(
            "Check-in and check-out dates are required."
        )
    if check_out <= check_in:
        raise InvalidBookingDates(
            "Check-out date must be after check-in."
        )
    return True


def check_room_availability(room, check_in, check_out, exclude_booking=None):
    """
    Returns True if the room is available.
    Raises:
        RoomUnavailable
    """
    if not is_room_available(room, check_in, check_out, exclude_booking=exclude_booking):
        raise RoomUnavailable(
            "This room is already booked for the selected dates."
        )
    return True


def is_room_available(room, check_in, check_out, exclude_booking=None):
    """
    Check if a room is available for the given dates.
    
    BLOCKING STATUSES: Only these bookings prevent availability
    - CONFIRMED: Booking is confirmed
    - CHECKED_IN: Guest is checked in
    - PENDING: Pending payment (blocks to prevent double-booking)
    
    NON-BLOCKING STATUSES: These do NOT prevent availability
    - CANCELLED: Booking was cancelled
    - CHECKED_OUT: Guest has checked out
    
    OVERLAP RULE:
    A room is unavailable if there exists a blocking booking where:
    existing.check_in < requested.check_out AND existing.check_out > requested.check_in
    """
    # Query for blocking bookings (those that prevent availability)
    # CRITICAL: Only CONFIRMED, CHECKED_IN, and PENDING block availability
    queryset = RoomBooking.objects.filter(
        room=room,
        status__in=["CONFIRMED", "CHECKED_IN", "PENDING"]  # Only blocking statuses
    )
    
    if exclude_booking:
        queryset = queryset.exclude(pk=exclude_booking.pk)
    
    # Check for date overlap using the overlap rule:
    # existing.check_in < requested.check_out AND existing.check_out > requested.check_in
    return not queryset.filter(
        check_in__lt=check_out,
        check_out__gt=check_in,
    ).exists()


def find_conflicting_bookings(room, check_in, check_out):
    """
    Find all bookings that conflict with the given dates.
    Returns bookings with blocking status that overlap the requested dates.
    """
    return RoomBooking.objects.filter(
        room=room,
        status__in=["CONFIRMED", "CHECKED_IN", "PENDING"],
        check_in__lt=check_out,
        check_out__gt=check_in,
    )


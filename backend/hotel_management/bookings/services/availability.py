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
    queryset = RoomBooking.objects.filter(
        room=room
    ).exclude(
        status__in=["CANCELLED", "CHECKED_OUT"]
    )
    if exclude_booking:
        queryset = queryset.exclude(pk=exclude_booking.pk)
    return not queryset.filter(
        check_in__lt=check_out,
        check_out__gt=check_in,
    ).exists()


def find_conflicting_bookings(room, check_in, check_out):
    pass

class BookingException(Exception):
    pass


class RoomUnavailable(BookingException):
    pass


class InvalidBookingDates(BookingException):
    pass

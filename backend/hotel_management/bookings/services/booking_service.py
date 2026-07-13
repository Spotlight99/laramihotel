import uuid

from ..models import RoomBooking, Invoice, HouseKeeping
from .availability import check_room_availability, validate_booking_dates
from .pricing import calculate_booking_price


class BookingService:
    @staticmethod
    def create_booking(
        *,
        room,
        guest_name,
        guest_email,
        guest_phone,
        guest_id,
        check_in,
        check_out,
        number_of_guests,
        special_requests,
    ):
        BookingService.validate_booking_request(
            room,
            check_in,
            check_out,
        )

        pricing = calculate_booking_price(
            room,
            check_in,
            check_out,
        )

        booking = BookingService.create_booking_record(
            room=room,
            guest_name=guest_name,
            guest_email=guest_email,
            guest_phone=guest_phone,
            guest_id=guest_id,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=number_of_guests,
            special_requests=special_requests,
            pricing=pricing,
        )
        BookingService.create_invoice(booking)
        BookingService.create_housekeeping(booking)

        return booking

    @staticmethod
    def validate_booking_request(room, check_in, check_out):
        # First validate date ranges
        validate_booking_dates(check_in, check_out)

        # Then ensure room is available for those dates
        check_room_availability(
            room,
            check_in,
            check_out,
        )

    @staticmethod
    def create_booking_record(
        *,
        room,
        guest_name,
        guest_email,
        guest_phone,
        guest_id,
        check_in,
        check_out,
        number_of_guests,
        special_requests,
        pricing,
    ):
        return RoomBooking.objects.create(
            guest_name=guest_name,
            guest_email=guest_email,
            guest_phone=guest_phone,
            guest_id=guest_id or "",
            room=room,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=number_of_guests,
            special_requests=special_requests,
            number_of_nights=pricing["nights"],
            total_price=pricing["total"],
        )

    @staticmethod
    def create_invoice(booking):
        if getattr(booking, "invoice", None):
            return booking.invoice

        return Invoice.objects.create(
            booking=booking,
            invoice_number=f"INV-{booking.id}-{uuid.uuid4().hex[:6].upper()}",
            room_charge=booking.total_price,
            total_amount=booking.total_price,
            payment_method="WHATSAPP",
        )

    @staticmethod
    def create_housekeeping(booking):
        if getattr(booking, "housekeeping", None):
            return booking.housekeeping

        return HouseKeeping.objects.create(
            booking=booking,
            room=booking.room,
            status="IN_PROGRESS",
        )

    @staticmethod
    def cancel_booking(booking):
        pass

    @staticmethod
    def check_in(booking):
        pass

    @staticmethod
    def check_out(booking):
        pass

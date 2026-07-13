from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase

from .services.pricing import calculate_booking_price
from .services.booking_service import BookingService
from hotel_management.rooms.models import Room, Hotel


class PricingServiceTests(TestCase):
    """Pricing service unit tests."""

    def setUp(self):
        self.hotel = Hotel.objects.create(
            name="Pricing Hotel",
            address="123 Pricing Lane",
            phone="+1111111111",
            email="pricing@example.com",
            manager_whatsapp="+1111111111",
        )

        self.room = Room.objects.create(
            hotel=self.hotel,
            room_number="301",
            room_type="STANDARD",
            price_per_night=Decimal("150.50"),
            status='AVAILABLE',
            capacity=2,
            amenities='',
            description='Pricing test room',
            image_url='',
        )

        self.check_in = date.today() + timedelta(days=5)
        self.check_out = self.check_in + timedelta(days=3)

    def test_calculate_booking_price_returns_nights_and_total(self):
        pricing = calculate_booking_price(self.room, self.check_in, self.check_out)

        self.assertEqual(pricing["nights"], 3)
        self.assertEqual(pricing["total"], Decimal("451.50"))
        self.assertIsInstance(pricing["total"], Decimal)

    def test_calculate_booking_price_handles_one_night(self):
        pricing = calculate_booking_price(
            self.room,
            self.check_in,
            self.check_in + timedelta(days=1),
        )

        self.assertEqual(pricing["nights"], 1)
        self.assertEqual(pricing["total"], Decimal("150.50"))

    def test_calculate_booking_price_uses_decimal_room_price(self):
        self.room.price_per_night = Decimal("199.99")
        self.room.save()

        pricing = calculate_booking_price(
            self.room,
            self.check_in,
            self.check_in + timedelta(days=2),
        )

        self.assertEqual(pricing["nights"], 2)
        self.assertEqual(pricing["total"], Decimal("399.98"))

    def test_calculate_booking_price_raises_for_same_day_booking(self):
        with self.assertRaises(ValueError):
            calculate_booking_price(self.room, self.check_in, self.check_in)

    def test_calculate_booking_price_raises_for_checkout_before_checkin(self):
        with self.assertRaises(ValueError):
            calculate_booking_price(self.room, self.check_out, self.check_in)

    def test_booking_service_uses_pricing_service_for_total(self):
        with patch(
            "hotel_management.bookings.services.booking_service.calculate_booking_price"
        ) as mock_calculate:
            mock_calculate.return_value = {
                "nights": 3,
                "total": Decimal("451.50"),
            }

            booking = BookingService.create_booking(
                room=self.room,
                guest_name="John Doe",
                guest_email="john@example.com",
                guest_phone="+1234567890",
                guest_id="user-pricing",
                check_in=self.check_in,
                check_out=self.check_out,
                number_of_guests=1,
                special_requests="",
            )

            mock_calculate.assert_called_once_with(self.room, self.check_in, self.check_out)
            self.assertEqual(booking.number_of_nights, 3)
            self.assertEqual(booking.total_price, Decimal("451.50"))

    def test_booking_service_records_pricing_values_in_booking(self):
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="Jane Doe",
            guest_email="jane@example.com",
            guest_phone="+0987654321",
            guest_id="user-pricing-2",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )

        self.assertEqual(booking.number_of_nights, 3)
        self.assertEqual(booking.total_price, Decimal("451.50"))

    def test_booking_service_records_decimal_total_price(self):
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="Sam Example",
            guest_email="sam@example.com",
            guest_phone="+2222222222",
            guest_id="user-pricing-3",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )

        self.assertIsInstance(booking.total_price, Decimal)
        self.assertEqual(booking.total_price, Decimal("451.50"))

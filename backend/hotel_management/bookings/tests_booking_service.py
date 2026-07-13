"""
BookingService tests for Phase 8.1
Tests to verify the booking service refactor maintains correct behavior.
"""
from django.test import TestCase
from datetime import date, timedelta
from decimal import Decimal
from .models import RoomBooking, Invoice, HouseKeeping
from .services.booking_service import BookingService
from .services.exceptions import RoomUnavailable, InvalidBookingDates
from hotel_management.rooms.models import Room, Hotel


class BookingServiceTests(TestCase):
    """Test BookingService orchestration"""

    def setUp(self):
        """Create test data"""
        # Create hotel
        self.hotel = Hotel.objects.create(
            name="Test Hotel",
            address="Test Address",
            phone="+1234567890",
            email="test@hotel.com",
            manager_whatsapp="+1234567890",
        )
        
        # Create room
        self.room = Room.objects.create(
            room_number="101",
            room_type="Deluxe",
            price_per_night=20000,  # ₦20,000
            status='AVAILABLE',
            description='Test room',
            image_url='',
            amenities=[],
            hotel=self.hotel
        )
        
        self.check_in = date.today() + timedelta(days=5)
        self.check_out = date.today() + timedelta(days=8)  # 3 nights

    def test_booking_service_creates_booking(self):
        """Test 1: Booking is created with correct guest information"""
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=2,
            special_requests="High floor please",
        )
        
        self.assertIsNotNone(booking)
        self.assertEqual(booking.guest_name, "John Doe")
        self.assertEqual(booking.guest_email, "john@example.com")
        self.assertEqual(booking.guest_phone, "+1234567890")
        self.assertEqual(booking.guest_id, "user-123")
        self.assertEqual(booking.room, self.room)
        self.assertEqual(booking.check_in, self.check_in)
        self.assertEqual(booking.check_out, self.check_out)
        self.assertEqual(booking.number_of_guests, 2)
        self.assertEqual(booking.special_requests, "High floor please")

    def test_booking_service_sets_correct_status(self):
        """Test that BookingService sets correct initial booking and payment status"""
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )
        
        # Test: booking status and payment status are correct
        self.assertEqual(booking.status, "PENDING")
        self.assertEqual(booking.payment_status, "PENDING")

    def test_booking_service_calculates_pricing_correctly(self):
        """Test 4: Price calculation is accurate"""
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )
        
        # Test: 3 nights * ₦20,000 = ₦60,000
        self.assertEqual(booking.number_of_nights, 3)
        self.assertEqual(booking.total_price, Decimal("60000"))

    def test_booking_service_creates_invoice(self):
        """Test 2: Invoice is created and linked to booking"""
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )
        
        # Test: Invoice exists and is linked
        self.assertTrue(hasattr(booking, "invoice"))
        self.assertIsNotNone(booking.invoice)
        self.assertEqual(booking.invoice.booking, booking)
        self.assertEqual(booking.invoice.room_charge, booking.total_price)
        self.assertEqual(booking.invoice.total_amount, booking.total_price)
        self.assertEqual(booking.invoice.payment_method, "WHATSAPP")

    def test_booking_service_creates_housekeeping(self):
        """Test 3: Housekeeping record is created and linked to booking"""
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )
        
        # Test: Housekeeping record exists and is linked
        self.assertTrue(hasattr(booking, "housekeeping"))
        self.assertIsNotNone(booking.housekeeping)
        self.assertEqual(booking.housekeeping.booking, booking)
        self.assertEqual(booking.housekeeping.room, self.room)
        self.assertEqual(booking.housekeeping.status, "IN_PROGRESS")

    def test_booking_service_rejects_unavailable_room(self):
        """Test 7: Booking fails if room is unavailable"""
        # Create existing booking
        existing = RoomBooking.objects.create(
            guest_name="Jane Doe",
            guest_email="jane@example.com",
            guest_phone="+0987654321",
            room=self.room,
            check_in=self.check_in,
            check_out=self.check_out,
            status="CONFIRMED"
        )
        
        # Test: Overlapping booking is rejected
        with self.assertRaises(RoomUnavailable):
            BookingService.create_booking(
                room=self.room,
                guest_name="John Doe",
                guest_email="john@example.com",
                guest_phone="+1234567890",
                guest_id="user-456",
                check_in=self.check_in,
                check_out=self.check_out,
                number_of_guests=1,
                special_requests="",
            )

    def test_booking_service_rejects_invalid_dates(self):
        """Test 6: Booking fails when dates are invalid"""
        # Test: Checkout before checkin is rejected
        with self.assertRaises(InvalidBookingDates):
            BookingService.create_booking(
                room=self.room,
                guest_name="John Doe",
                guest_email="john@example.com",
                guest_phone="+1234567890",
                guest_id="user-123",
                check_in=self.check_out,
                check_out=self.check_in,  # Invalid: before check-in
                number_of_guests=1,
                special_requests="",
            )

    def test_invoice_total_matches_booking_total(self):
        """Test 2b: Invoice total matches booking total"""
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )
        
        # Test: Invoice totals match booking total
        self.assertEqual(booking.total_price, booking.invoice.room_charge)
        self.assertEqual(booking.total_price, booking.invoice.total_amount)

    def test_nights_calculation_accuracy(self):
        """Test 5: Number of nights is accurate"""
        # Test: 1 night
        booking_1_night = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=date.today() + timedelta(days=5),
            check_out=date.today() + timedelta(days=6),
            number_of_guests=1,
            special_requests="",
        )
        self.assertEqual(booking_1_night.number_of_nights, 1)
        
        # Test: 7 nights
        booking_7_nights = BookingService.create_booking(
            room=self.room,
            guest_name="Jane Doe",
            guest_email="jane@example.com",
            guest_phone="+0987654321",
            guest_id="user-456",
            check_in=date.today() + timedelta(days=10),
            check_out=date.today() + timedelta(days=17),
            number_of_guests=1,
            special_requests="",
        )
        self.assertEqual(booking_7_nights.number_of_nights, 7)

    def test_booking_response_contains_required_fields(self):
        """Test 8: Booking response contains required fields"""
        booking = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )
        
        # Test: Booking has all required fields
        self.assertIsNotNone(booking.id)
        self.assertIsNotNone(booking.guest_name)
        self.assertIsNotNone(booking.room)
        self.assertIsNotNone(booking.check_in)
        self.assertIsNotNone(booking.check_out)
        self.assertIsNotNone(booking.total_price)
        self.assertIsNotNone(booking.invoice)
        self.assertIsNotNone(booking.housekeeping)

    def test_adjacent_bookings_allowed(self):
        """Test that adjacent bookings don't conflict"""
        # Create first booking
        booking1 = BookingService.create_booking(
            room=self.room,
            guest_name="Jane Doe",
            guest_email="jane@example.com",
            guest_phone="+0987654321",
            guest_id="user-456",
            check_in=self.check_in,
            check_out=self.check_out,
            number_of_guests=1,
            special_requests="",
        )
        
        # Test: Adjacent booking is allowed
        booking2 = BookingService.create_booking(
            room=self.room,
            guest_name="John Doe",
            guest_email="john@example.com",
            guest_phone="+1234567890",
            guest_id="user-123",
            check_in=self.check_out,  # Exactly when first ends
            check_out=self.check_out + timedelta(days=2),
            number_of_guests=1,
            special_requests="",
        )
        
        self.assertIsNotNone(booking2)

from django.test import TestCase
from datetime import date, timedelta

from hotel_management.rooms.models import Hotel, Room
from .models import RoomBooking
from .services.availability import (
    validate_booking_dates,
    is_room_available,
    check_room_availability,
)
from .services.exceptions import InvalidBookingDates, RoomUnavailable


class AvailabilityServiceTests(TestCase):
    def setUp(self):
        # create hotel and room fixtures
        self.hotel = Hotel.objects.create(
            name="Avail Hotel",
            address="Test Address",
            phone="+111111111",
            email="avail@example.com",
            manager_whatsapp="+111111111",
        )

        self.room = Room.objects.create(
            room_number="201",
            room_type="STANDARD",
            price_per_night=100.00,
            status='AVAILABLE',
            description='Availability test room',
            image_url='',
            amenities='',
            hotel=self.hotel,
        )

    def test_valid_dates_pass(self):
        check_in = date(2026, 8, 1)
        check_out = date(2026, 8, 5)
        self.assertTrue(validate_booking_dates(check_in, check_out))

    def test_invalid_dates_equal_raises(self):
        check_in = date(2026, 8, 5)
        check_out = date(2026, 8, 5)
        with self.assertRaises(InvalidBookingDates):
            validate_booking_dates(check_in, check_out)

    def test_invalid_dates_check_out_before_raises(self):
        check_in = date(2026, 8, 6)
        check_out = date(2026, 8, 5)
        with self.assertRaises(InvalidBookingDates):
            validate_booking_dates(check_in, check_out)

    def test_room_available_when_no_bookings(self):
        check_in = date(2026, 8, 10)
        check_out = date(2026, 8, 12)
        self.assertTrue(is_room_available(self.room, check_in, check_out))
        # check_room_availability should return True (not raise)
        self.assertTrue(check_room_availability(self.room, check_in, check_out))

    def test_confirmed_booking_blocks_room(self):
        existing_ci = date(2026, 8, 1)
        existing_co = date(2026, 8, 5)
        RoomBooking.objects.create(
            guest_name='A',
            guest_email='a@x.com',
            guest_phone='+0',
            room=self.room,
            check_in=existing_ci,
            check_out=existing_co,
            status='CONFIRMED',
        )

        # overlapping
        self.assertFalse(is_room_available(self.room, date(2026, 8, 4), date(2026, 8, 7)))
        with self.assertRaises(RoomUnavailable):
            check_room_availability(self.room, date(2026, 8, 4), date(2026, 8, 7))

    def test_cancelled_booking_ignored(self):
        existing_ci = date(2026, 8, 1)
        existing_co = date(2026, 8, 5)
        RoomBooking.objects.create(
            guest_name='B',
            guest_email='b@x.com',
            guest_phone='+0',
            room=self.room,
            check_in=existing_ci,
            check_out=existing_co,
            status='CANCELLED',
        )

        # same dates should be allowed
        self.assertTrue(is_room_available(self.room, existing_ci, existing_co))

    def test_checked_out_booking_ignored(self):
        existing_ci = date(2026, 8, 1)
        existing_co = date(2026, 8, 5)
        RoomBooking.objects.create(
            guest_name='C',
            guest_email='c@x.com',
            guest_phone='+0',
            room=self.room,
            check_in=existing_ci,
            check_out=existing_co,
            status='CHECKED_OUT',
        )

        self.assertTrue(is_room_available(self.room, existing_ci, existing_co))

    def test_pending_booking_blocks_if_implemented(self):
        # current implementation excludes only CANCELLED and CHECKED_OUT, so PENDING should block
        existing_ci = date(2026, 8, 1)
        existing_co = date(2026, 8, 5)
        RoomBooking.objects.create(
            guest_name='D',
            guest_email='d@x.com',
            guest_phone='+0',
            room=self.room,
            check_in=existing_ci,
            check_out=existing_co,
            status='PENDING',
        )

        self.assertFalse(is_room_available(self.room, existing_ci, existing_co))

    def test_edge_overlap_cases(self):
        # Existing: 1 Aug -> 5 Aug
        existing_ci = date(2026, 8, 1)
        existing_co = date(2026, 8, 5)
        RoomBooking.objects.create(
            guest_name='E',
            guest_email='e@x.com',
            guest_phone='+0',
            room=self.room,
            check_in=existing_ci,
            check_out=existing_co,
            status='CONFIRMED',
        )

        # 5 Aug -> 8 Aug allowed
        self.assertTrue(is_room_available(self.room, date(2026, 8, 5), date(2026, 8, 8)))

        # 4 Aug -> 7 Aug rejected
        self.assertFalse(is_room_available(self.room, date(2026, 8, 4), date(2026, 8, 7)))

        # 1 Aug -> 5 Aug exact match rejected
        self.assertFalse(is_room_available(self.room, existing_ci, existing_co))

    def test_different_room_unaffected(self):
        # create another room
        room2 = Room.objects.create(
            room_number="202",
            room_type="STANDARD",
            price_per_night=120.00,
            status='AVAILABLE',
            description='Other room',
            image_url='',
            amenities='',
            hotel=self.hotel,
        )

        # booking in room1
        RoomBooking.objects.create(
            guest_name='F',
            guest_email='f@x.com',
            guest_phone='+0',
            room=self.room,
            check_in=date(2026, 9, 1),
            check_out=date(2026, 9, 5),
            status='CONFIRMED',
        )

        # room2 should be available for same dates
        self.assertTrue(is_room_available(room2, date(2026, 9, 1), date(2026, 9, 5)))

    def test_different_hotel_room_isolated(self):
        # Two hotels; ensure room in other hotel is unaffected
        hotel2 = Hotel.objects.create(
            name="Other Hotel",
            address="Addr",
            phone="+222",
            email="other@example.com",
            manager_whatsapp="+222",
        )
        # create room in other hotel
        other_room = Room.objects.create(
            room_number="301",
            room_type="STANDARD",
            price_per_night=90.00,
            status='AVAILABLE',
            description='Other hotel room',
            image_url='',
            amenities='',
            hotel=hotel2,
        )

        # create booking in original room
        RoomBooking.objects.create(
            guest_name='G',
            guest_email='g@x.com',
            guest_phone='+0',
            room=self.room,
            check_in=date(2026, 10, 1),
            check_out=date(2026, 10, 5),
            status='CONFIRMED',
        )

        # other_room should be available for same dates
        self.assertTrue(is_room_available(other_room, date(2026, 10, 1), date(2026, 10, 5)))

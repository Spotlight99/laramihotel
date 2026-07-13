from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import RoomBooking, Invoice
from hotel_management.rooms.models import Room, Hotel


class RoomBookingSerializerTests(TestCase):
    """Test RoomBookingSerializer validation"""

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
        
        # Create rooms
        self.room = Room.objects.create(
            room_number="101",
            room_type="Deluxe",
            price_per_night=100.00,
            status='AVAILABLE',
            description='Test room',
            image_url='',
            amenities=[],
            hotel=self.hotel
        )
        
        self.check_in = date.today() + timedelta(days=5)
        self.check_out = date.today() + timedelta(days=10)

    def test_check_out_must_be_after_check_in(self):
        """Test that check-out date must be after check-in"""
        from .serializers import RoomBookingSerializer
        
        serializer = RoomBookingSerializer(data={
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_out,
            'check_out': self.check_in,  # Invalid: before check-in
            'number_of_guests': 1,
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('Check-out date must be after check-in', str(serializer.errors))

    def test_overlapping_booking_rejected(self):
        """Test that overlapping bookings are rejected"""
        from .serializers import RoomBookingSerializer
        
        # Create existing booking
        existing_booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room,
            check_in=self.check_in,
            check_out=self.check_out,
            status='CONFIRMED'
        )
        
        # Try to create overlapping booking
        serializer = RoomBookingSerializer(data={
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_in + timedelta(days=1),  # Overlaps
            'check_out': self.check_out - timedelta(days=1),  # Overlaps
            'number_of_guests': 1,
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('already booked for the selected dates', str(serializer.errors))

    def test_adjacent_bookings_allowed(self):
        """Test that adjacent bookings (no overlap) are allowed"""
        from .serializers import RoomBookingSerializer
        
        # Create existing booking
        existing_booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room,
            check_in=self.check_in,
            check_out=self.check_out,
            status='CONFIRMED'
        )
        
        # Try to create booking right after (no overlap)
        serializer = RoomBookingSerializer(data={
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_out,  # Exactly when previous ends
            'check_out': self.check_out + timedelta(days=5),
            'number_of_guests': 1,
        })
        
        self.assertTrue(serializer.is_valid(), f"Errors: {serializer.errors}")

    def test_cancelled_bookings_ignored(self):
        """Test that cancelled bookings don't prevent new bookings"""
        from .serializers import RoomBookingSerializer
        
        # Create cancelled booking
        cancelled_booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room,
            check_in=self.check_in,
            check_out=self.check_out,
            status='CANCELLED'
        )
        
        # Try to create booking in same dates (should succeed)
        serializer = RoomBookingSerializer(data={
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_in,
            'check_out': self.check_out,
            'number_of_guests': 1,
        })
        
        self.assertTrue(serializer.is_valid(), f"Errors: {serializer.errors}")

    def test_checked_out_bookings_ignored(self):
        """Test that checked-out bookings don't prevent new bookings"""
        from .serializers import RoomBookingSerializer
        
        # Create checked-out booking
        checked_out_booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room,
            check_in=self.check_in,
            check_out=self.check_out,
            status='CHECKED_OUT'
        )
        
        # Try to create booking in same dates (should succeed)
        serializer = RoomBookingSerializer(data={
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_in,
            'check_out': self.check_out,
            'number_of_guests': 1,
        })
        
        self.assertTrue(serializer.is_valid(), f"Errors: {serializer.errors}")

    def test_partial_overlap_rejected(self):
        """Test that partial overlaps are rejected"""
        from .serializers import RoomBookingSerializer
        
        # Create existing booking
        existing_booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room,
            check_in=self.check_in,
            check_out=self.check_out,
            status='PENDING'
        )
        
        # Try to create booking with partial overlap (extends beyond)
        serializer = RoomBookingSerializer(data={
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_out - timedelta(days=2),  # Overlaps at the end
            'check_out': self.check_out + timedelta(days=3),
            'number_of_guests': 1,
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('already booked for the selected dates', str(serializer.errors))


class RoomBookingAPITests(APITestCase):
    """Test RoomBooking API endpoints with double booking prevention"""

    def setUp(self):
        """Create test data and client"""
        self.client = APIClient()
        
        # Create hotel
        self.hotel = Hotel.objects.create(
            name="Test Hotel",
            address="Test Address",
            phone="+1234567890",
            email="test@hotel.com",
            manager_whatsapp="+1234567890",
        )
        
        # Create rooms
        self.room = Room.objects.create(
            room_number="101",
            room_type="Deluxe",
            price_per_night=100.00,
            status='AVAILABLE',
            description='Test room',
            image_url='',
            amenities=[],
            hotel=self.hotel
        )
        
        self.check_in = date.today() + timedelta(days=5)
        self.check_out = date.today() + timedelta(days=10)
        
        self.booking_url = '/api/bookings/'

    def test_create_booking_success(self):
        """Test successful booking creation"""
        payload = {
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        
        response = self.client.post(self.booking_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('booking', response.data)
        self.assertIn('invoice', response.data)

    def test_create_overlapping_booking_rejected_at_api_level(self):
        """Test that overlapping bookings are rejected at API level"""
        # Create first booking
        first_payload = {
            'guest_name': 'Jane Doe',
            'guest_email': 'jane@example.com',
            'guest_phone': '+0987654321',
            'room_id': self.room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        
        response1 = self.client.post(self.booking_url, first_payload, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Try to create overlapping booking
        second_payload = {
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': (self.check_in + timedelta(days=1)).isoformat(),
            'check_out': (self.check_out - timedelta(days=1)).isoformat(),
            'number_of_guests': 1,
        }
        
        response2 = self.client.post(self.booking_url, second_payload, format='json')
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        # DRF returns structured serializer errors; availability uses non_field_errors
        non_field = response2.data.get('non_field_errors', [])
        self.assertTrue(non_field, f"Expected non_field_errors in {response2.data}")
        self.assertIn('already booked', non_field[0].lower())

    def test_create_adjacent_booking_allowed(self):
        """Test that adjacent bookings are allowed"""
        # Create first booking
        first_payload = {
            'guest_name': 'Jane Doe',
            'guest_email': 'jane@example.com',
            'guest_phone': '+0987654321',
            'room_id': self.room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        
        response1 = self.client.post(self.booking_url, first_payload, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Create adjacent booking
        second_payload = {
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_out.isoformat(),
            'check_out': (self.check_out + timedelta(days=5)).isoformat(),
            'number_of_guests': 1,
        }
        
        response2 = self.client.post(self.booking_url, second_payload, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)

    def test_after_cancellation_room_available(self):
        """Test that after cancellation, room becomes available"""
        # Create and cancel booking
        first_payload = {
            'guest_name': 'Jane Doe',
            'guest_email': 'jane@example.com',
            'guest_phone': '+0987654321',
            'room_id': self.room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        
        response1 = self.client.post(self.booking_url, first_payload, format='json')
        booking_id = response1.data['booking']['id']
        
        # Cancel the booking
        cancel_response = self.client.post(f'{self.booking_url}{booking_id}/cancel/', {}, format='json')
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        
        # Now try to book same dates (should succeed)
        second_payload = {
            'guest_name': 'John Doe',
            'guest_email': 'john@example.com',
            'guest_phone': '+1234567890',
            'room_id': self.room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        
        response2 = self.client.post(self.booking_url, second_payload, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)


class RoomAvailabilityEndpointTests(APITestCase):
    """Test the available rooms endpoint"""

    def setUp(self):
        """Create test data"""
        self.client = APIClient()
        
        # Create hotel
        self.hotel = Hotel.objects.create(
            name="Test Hotel",
            address="Test Address",
            phone="+1234567890",
            email="test@hotel.com",
            manager_whatsapp="+1234567890",
        )
        
        # Create multiple rooms
        self.room1 = Room.objects.create(
            room_number="101",
            room_type="Deluxe",
            price_per_night=100.00,
            status='AVAILABLE',
            description='Test room 1',
            image_url='',
            amenities=[],
            hotel=self.hotel
        )
        
        self.room2 = Room.objects.create(
            room_number="102",
            room_type="Standard",
            price_per_night=80.00,
            status='AVAILABLE',
            description='Test room 2',
            image_url='',
            amenities=[],
            hotel=self.hotel
        )
        
        self.check_in = date.today() + timedelta(days=5)
        self.check_out = date.today() + timedelta(days=10)
        
        self.available_url = '/api/rooms/available/'

    def test_available_rooms_returns_unbooked_rooms(self):
        """Test that available rooms endpoint returns unbooked rooms"""
        response = self.client.get(
            self.available_url,
            {
                'check_in': self.check_in.isoformat(),
                'check_out': self.check_out.isoformat(),
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_available_rooms_excludes_booked_rooms(self):
        """Test that available rooms endpoint excludes booked rooms"""
        # Book room 1
        booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room1,
            check_in=self.check_in,
            check_out=self.check_out,
            status='CONFIRMED'
        )
        
        response = self.client.get(
            self.available_url,
            {
                'check_in': self.check_in.isoformat(),
                'check_out': self.check_out.isoformat(),
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return room2
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.room2.id)

    def test_available_rooms_excludes_pending_bookings(self):
        """Test that available rooms endpoint excludes PENDING bookings"""
        # Create PENDING booking for room 1
        booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room1,
            check_in=self.check_in,
            check_out=self.check_out,
            status='PENDING'  # Not paid yet
        )
        
        response = self.client.get(
            self.available_url,
            {
                'check_in': self.check_in.isoformat(),
                'check_out': self.check_out.isoformat(),
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return room2
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.room2.id)

    def test_available_rooms_includes_cancelled_bookings(self):
        """Test that available rooms endpoint includes rooms with cancelled bookings"""
        # Create cancelled booking for room 1
        booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room1,
            check_in=self.check_in,
            check_out=self.check_out,
            status='CANCELLED'
        )
        
        response = self.client.get(
            self.available_url,
            {
                'check_in': self.check_in.isoformat(),
                'check_out': self.check_out.isoformat(),
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return both rooms
        self.assertEqual(len(response.data), 2)

    def test_available_rooms_includes_checked_out_bookings(self):
        """Test that available rooms endpoint includes rooms with checked-out bookings"""
        # Create checked-out booking for room 1
        booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room1,
            check_in=self.check_in,
            check_out=self.check_out,
            status='CHECKED_OUT'
        )
        
        response = self.client.get(
            self.available_url,
            {
                'check_in': self.check_in.isoformat(),
                'check_out': self.check_out.isoformat(),
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return both rooms
        self.assertEqual(len(response.data), 2)

    def test_available_rooms_partial_overlap(self):
        """Test that partially overlapping bookings exclude the room"""
        # Book room 1 from check_in to check_out + 5 days
        booking = RoomBooking.objects.create(
            guest_name='Jane Doe',
            guest_email='jane@example.com',
            guest_phone='+0987654321',
            room=self.room1,
            check_in=self.check_in + timedelta(days=2),
            check_out=self.check_out + timedelta(days=2),
            status='CONFIRMED'
        )
        
        response = self.client.get(
            self.available_url,
            {
                'check_in': self.check_in.isoformat(),
                'check_out': self.check_out.isoformat(),
            }
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return room2
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.room2.id)

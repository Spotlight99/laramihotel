from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import RoomBooking, Invoice, HouseKeeping
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

    def create_booking(self, guest_name='John Doe', guest_email='john@example.com', guest_phone='+1234567890'):
        payload = {
            'guest_name': guest_name,
            'guest_email': guest_email,
            'guest_phone': guest_phone,
            'room_id': self.room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        response = self.client.post(self.booking_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response

    def cancel_booking(self, booking_id):
        return self.client.post(f'{self.booking_url}{booking_id}/cancel/', {}, format='json')

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

    def test_retrieve_existing_booking_by_id(self):
        """Test retrieving an existing booking by ID."""
        response1 = self.create_booking(
            guest_name='Alice Lookup',
            guest_email='alice@example.com',
            guest_phone='+1111111111',
        )
        booking_id = response1.data['booking']['id']

        lookup_response = self.client.get(f'{self.booking_url}{booking_id}/', format='json')
        self.assertEqual(lookup_response.status_code, status.HTTP_200_OK)
        self.assertEqual(lookup_response.data['id'], booking_id)
        self.assertEqual(lookup_response.data['guest_name'], 'Alice Lookup')
        self.assertEqual(lookup_response.data['guest_email'], 'alice@example.com')
        self.assertEqual(lookup_response.data['guest_phone'], '+1111111111')
        self.assertEqual(lookup_response.data['room']['id'], self.room.id)
        self.assertEqual(lookup_response.data['room']['room_number'], self.room.room_number)

    def test_retrieve_nonexistent_booking_returns_404(self):
        """Test lookup returns 404 for a missing booking."""
        lookup_response = self.client.get(f'{self.booking_url}999999/', format='json')
        self.assertEqual(lookup_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(lookup_response.data.get('detail'), 'Not found.')

    def test_retrieve_cancelled_booking_by_id(self):
        """Test cancelled bookings are still retrievable."""
        signup_response = self.create_booking(
            guest_name='Cancelled Guest',
            guest_email='cancelled@example.com',
            guest_phone='+2222222222',
        )
        booking_id = signup_response.data['booking']['id']
        cancel_response = self.client.post(f'{self.booking_url}{booking_id}/cancel/', {}, format='json')
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        lookup_response = self.client.get(f'{self.booking_url}{booking_id}/', format='json')
        self.assertEqual(lookup_response.status_code, status.HTTP_200_OK)
        self.assertEqual(lookup_response.data['id'], booking_id)
        self.assertEqual(lookup_response.data['status'], 'CANCELLED')
        self.assertEqual(lookup_response.data['guest_email'], 'cancelled@example.com')
        self.assertEqual(lookup_response.data['room']['id'], self.room.id)

    def test_retrieve_confirmed_booking_by_id(self):
        """Test confirmed bookings return preserved payment status."""
        booking_payload = {
            'guest_name': 'Confirmed Guest',
            'guest_email': 'confirmed@example.com',
            'guest_phone': '+3333333333',
            'room_id': self.room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        create_response = self.client.post(self.booking_url, booking_payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        booking_id = create_response.data['booking']['id']

        booking = RoomBooking.objects.get(pk=booking_id)
        booking.status = 'CONFIRMED'
        booking.payment_status = 'COMPLETED'
        booking.save()

        lookup_response = self.client.get(f'{self.booking_url}{booking_id}/', format='json')
        self.assertEqual(lookup_response.status_code, status.HTTP_200_OK)
        self.assertEqual(lookup_response.data['status'], 'CONFIRMED')
        self.assertEqual(lookup_response.data['payment_status'], 'COMPLETED')

    def test_retrieve_pending_booking_by_id(self):
        """Test pending bookings remain unchanged on lookup."""
        create_response = self.create_booking(
            guest_name='Pending Guest',
            guest_email='pending@example.com',
            guest_phone='+4444444444',
        )
        booking_id = create_response.data['booking']['id']

        lookup_response = self.client.get(f'{self.booking_url}{booking_id}/', format='json')
        self.assertEqual(lookup_response.status_code, status.HTTP_200_OK)
        self.assertEqual(lookup_response.data['status'], 'PENDING')
        self.assertEqual(lookup_response.data['guest_email'], 'pending@example.com')
        self.assertEqual(lookup_response.data['room']['id'], self.room.id)

    def test_lookup_response_contract_contains_expected_booking_fields(self):
        """Test lookup response contains the expected booking payload."""
        create_response = self.create_booking(
            guest_name='Contract Guest',
            guest_email='contract@example.com',
            guest_phone='+5555555555',
        )
        booking_id = create_response.data['booking']['id']

        lookup_response = self.client.get(f'{self.booking_url}{booking_id}/', format='json')
        self.assertEqual(lookup_response.status_code, status.HTTP_200_OK)

        expected_keys = {
            'id', 'guest_name', 'guest_email', 'guest_phone', 'guest_id',
            'room', 'check_in', 'check_out', 'number_of_guests',
            'special_requests', 'status', 'total_price', 'number_of_nights',
            'payment_status', 'payment_reference', 'created_at', 'updated_at',
        }
        self.assertTrue(expected_keys.issubset(set(lookup_response.data.keys())))
        self.assertIn('room_number', lookup_response.data['room'])


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


class RoomBookingIntegrationTests(APITestCase):
    """Integration tests for guest-facing booking API workflows."""

    def setUp(self):
        self.client = APIClient()
        self.hotel = Hotel.objects.create(
            name="Integration Hotel",
            address="123 Test Blvd",
            phone="+1234567890",
            email="integration@example.com",
            manager_whatsapp="+1234567890",
        )
        self.room = Room.objects.create(
            room_number="501",
            room_type="Deluxe",
            price_per_night=150.00,
            status='AVAILABLE',
            description='Integration test room',
            image_url='',
            amenities=[],
            hotel=self.hotel
        )
        self.room2 = Room.objects.create(
            room_number="502",
            room_type="Deluxe",
            price_per_night=150.00,
            status='AVAILABLE',
            description='Integration test room 2',
            image_url='',
            amenities=[],
            hotel=self.hotel
        )
        self.check_in = date.today() + timedelta(days=5)
        self.check_out = date.today() + timedelta(days=10)
        self.booking_url = '/api/bookings/'

    def create_booking(self, guest_name='Integration Guest', guest_email='integration@example.com', guest_phone='+1234567890', room=None):
        room = room or self.room
        payload = {
            'guest_name': guest_name,
            'guest_email': guest_email,
            'guest_phone': guest_phone,
            'room_id': room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        response = self.client.post(self.booking_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data

    def test_create_booking_returns_payment_link_invoice_and_booking(self):
        data = self.create_booking()

        self.assertIn('booking', data)
        self.assertIn('invoice', data)
        self.assertIn('payment_link', data)

        booking = data['booking']
        invoice = data['invoice']

        self.assertEqual(booking['guest_email'], 'integration@example.com')
        self.assertEqual(booking['room']['id'], self.room.id)
        self.assertEqual(invoice['booking']['id'], booking['id'])
        self.assertEqual(invoice['payment_status'], 'PENDING')
        self.assertTrue(data['payment_link'].startswith('https://wa.me/'))

    def test_search_by_email_returns_matching_bookings(self):
        self.create_booking(guest_name='Search One', guest_email='lookup@example.com', guest_phone='+1111111111', room=self.room)
        self.create_booking(guest_name='Search Two', guest_email='lookup@example.com', guest_phone='+2222222222', room=self.room2)

        response = self.client.get(f'{self.booking_url}search/', {'email': 'lookup@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertTrue(all(item['guest_email'] == 'lookup@example.com' for item in response.data))

    def test_search_by_phone_returns_matching_bookings(self):
        self.create_booking(guest_name='Search Phone', guest_email='phone@example.com', guest_phone='+3333333333')

        response = self.client.get(f'{self.booking_url}search/', {'phone': '+3333333333'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['guest_phone'], '+3333333333')

    def test_payment_link_endpoint_returns_existing_invoice_and_total_amount(self):
        booking_data = self.create_booking(guest_name='Payment Test', guest_email='pay@example.com', guest_phone='+4444444444')
        booking_id = booking_data['booking']['id']

        response = self.client.get(f'{self.booking_url}{booking_id}/payment_link/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('payment_link', response.data)
        self.assertIn('total_amount', response.data)
        self.assertEqual(float(response.data['total_amount']), float(RoomBooking.objects.get(pk=booking_id).total_price))

    def test_payment_link_endpoint_returns_404_for_missing_booking(self):
        response = self.client.get(f'{self.booking_url}999999/payment_link/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data.get('error'), 'Booking not found')

    def test_public_cancel_endpoint_updates_booking_and_invoice(self):
        booking_data = self.create_booking(guest_name='Cancel Public', guest_email='cancel-public@example.com', guest_phone='+5555555555')
        booking_id = booking_data['booking']['id']

        response = self.client.post(f'{self.booking_url}{booking_id}/cancel/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['booking']['status'], 'CANCELLED')

        booking = RoomBooking.objects.get(pk=booking_id)
        self.assertEqual(booking.status, 'CANCELLED')
        self.assertEqual(booking.invoice.payment_status, 'CANCELLED')
        self.assertEqual(Invoice.objects.filter(booking=booking).count(), 1)

    def test_cancel_endpoint_returns_404_for_missing_booking(self):
        response = self.client.post(f'{self.booking_url}999999/cancel/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data.get('error'), 'Booking not found')

    def test_search_endpoint_requires_email_or_phone(self):
        response = self.client.get(f'{self.booking_url}search/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get('error'), 'Email or phone required')

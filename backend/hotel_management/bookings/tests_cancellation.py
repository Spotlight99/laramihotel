from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import RoomBooking, Invoice, HouseKeeping
from .serializers import RoomBookingSerializer
from .services.availability import check_room_availability, is_room_available
from hotel_management.rooms.models import Room, Hotel


class BookingCancellationTests(APITestCase):
    """Test booking cancellation workflow and related regression behavior."""

    def setUp(self):
        self.client = APIClient()
        self.hotel = Hotel.objects.create(
            name="Cancel Hotel",
            address="1 Cancel Lane",
            phone="+1111111111",
            email="cancel@example.com",
            manager_whatsapp="+1111111111",
        )

        self.room = Room.objects.create(
            hotel=self.hotel,
            room_number="401",
            room_type="STANDARD",
            price_per_night=Decimal("120.00"),
            status='AVAILABLE',
            description='Cancellation room',
            image_url='',
            amenities='',
        )

        self.check_in = date.today() + timedelta(days=7)
        self.check_out = self.check_in + timedelta(days=4)
        self.booking_url = '/api/bookings/'

    def create_booking(self, guest_name="John Doe", guest_email="john@example.com", guest_phone="+1234567890"):
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
        return response.data['booking'], response.data['invoice']

    def cancel_booking(self, booking_id):
        return self.client.post(f'{self.booking_url}{booking_id}/cancel/', {}, format='json')

    def test_successful_cancellation_updates_status_and_keeps_booking(self):
        booking_data, invoice_data = self.create_booking()
        booking_id = booking_data['id']

        cancel_response = self.cancel_booking(booking_id)
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        self.assertIn('booking', cancel_response.data)

        booking = RoomBooking.objects.get(pk=booking_id)
        self.assertEqual(booking.status, 'CANCELLED')
        self.assertTrue(RoomBooking.objects.filter(pk=booking_id).exists())

        serialized = RoomBookingSerializer(booking).data
        self.assertEqual(serialized['id'], booking_id)
        self.assertEqual(serialized['status'], 'CANCELLED')
        self.assertEqual(serialized['guest_name'], booking_data['guest_name'])

    def test_room_becomes_available_after_cancellation(self):
        booking_data, invoice_data = self.create_booking()
        booking_id = booking_data['id']

        cancel_response = self.cancel_booking(booking_id)
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        self.assertTrue(
            is_room_available(self.room, self.check_in, self.check_out),
            'Room should be available after cancellation',
        )
        self.assertTrue(
            check_room_availability(self.room, self.check_in, self.check_out),
            'check_room_availability should return True after cancellation',
        )

        second_payload = {
            'guest_name': 'Jane Roe',
            'guest_email': 'jane@example.com',
            'guest_phone': '+0987654321',
            'room_id': self.room.id,
            'check_in': self.check_in.isoformat(),
            'check_out': self.check_out.isoformat(),
            'number_of_guests': 1,
        }
        response2 = self.client.post(self.booking_url, second_payload, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.data['booking']['room']['id'], self.room.id)

    def test_cancelling_already_cancelled_booking_returns_400(self):
        booking_data, invoice_data = self.create_booking()
        booking_id = booking_data['id']

        first_cancel = self.cancel_booking(booking_id)
        self.assertEqual(first_cancel.status_code, status.HTTP_200_OK)

        second_cancel = self.cancel_booking(booking_id)
        self.assertEqual(second_cancel.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', second_cancel.data)
        self.assertIn('Cannot cancel booking with status CANCELLED', second_cancel.data['error'])

    def test_invoice_persists_and_remains_linked_after_cancellation(self):
        booking_data, invoice_data = self.create_booking()
        booking_id = booking_data['id']

        invoice_before = Invoice.objects.get(pk=invoice_data['id'])
        invoice_number_before = invoice_before.invoice_number
        payment_status_before = invoice_before.payment_status

        cancel_response = self.cancel_booking(booking_id)
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        invoice_after = Invoice.objects.get(pk=invoice_before.pk)
        self.assertEqual(invoice_after.booking_id, booking_id)
        self.assertEqual(invoice_after.invoice_number, invoice_number_before)
        self.assertEqual(invoice_after.payment_method, invoice_before.payment_method)
        self.assertEqual(invoice_after.payment_status, 'CANCELLED')

    def test_housekeeping_remains_intact_after_cancellation(self):
        booking_data, invoice_data = self.create_booking()
        booking_id = booking_data['id']

        booking = RoomBooking.objects.get(pk=booking_id)
        housekeeping_before = booking.housekeeping
        self.assertIsNotNone(housekeeping_before)
        self.assertEqual(housekeeping_before.room_id, self.room.id)
        self.assertEqual(housekeeping_before.booking_id, booking.id)

        cancel_response = self.cancel_booking(booking_id)
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        housekeeping_after = HouseKeeping.objects.get(pk=housekeeping_before.pk)
        self.assertEqual(housekeeping_after.booking_id, booking.id)
        self.assertEqual(housekeeping_after.room_id, self.room.id)
        self.assertEqual(housekeeping_after.status, housekeeping_before.status)

    def test_cancellation_does_not_generate_new_invoice_record(self):
        booking_data, invoice_data = self.create_booking()
        booking_id = booking_data['id']

        initial_invoice_count = Invoice.objects.filter(booking_id=booking_id).count()
        self.assertEqual(initial_invoice_count, 1)

        invoice_before = Invoice.objects.get(booking_id=booking_id)
        invoice_number_before = invoice_before.invoice_number

        cancel_response = self.cancel_booking(booking_id)
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        invoice_after = Invoice.objects.get(booking_id=booking_id)
        self.assertEqual(invoice_after.id, invoice_before.id)
        self.assertEqual(invoice_after.invoice_number, invoice_number_before)
        self.assertEqual(Invoice.objects.filter(booking_id=booking_id).count(), 1)

    def test_search_returns_cancelled_booking_in_reservation_lookup(self):
        booking_data, invoice_data = self.create_booking(guest_name='Cancelled Guest', guest_email='cancelled@example.com', guest_phone='+1111111111')
        booking_id = booking_data['id']

        cancel_response = self.cancel_booking(booking_id)
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        search_response = self.client.get(f'{self.booking_url}search/', {'email': 'cancelled@example.com'})
        self.assertEqual(search_response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(search_response.data, list)
        self.assertTrue(any(item['id'] == booking_id for item in search_response.data))
        self.assertTrue(any(item['status'] == 'CANCELLED' for item in search_response.data))

    def test_cancel_endpoint_returns_404_for_invalid_booking_id(self):
        invalid_id = 999999
        response = self.cancel_booking(invalid_id)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data.get('error'), 'Booking not found')

    def test_booking_integrity_preserved_after_cancellation(self):
        booking_data, invoice_data = self.create_booking(guest_name='Integrity Guest', guest_email='integrity@example.com', guest_phone='+2222222222')
        booking_id = booking_data['id']

        booking_before = RoomBooking.objects.get(pk=booking_id)
        original_fields = {
            'guest_name': booking_before.guest_name,
            'guest_email': booking_before.guest_email,
            'guest_phone': booking_before.guest_phone,
            'guest_id': booking_before.guest_id,
            'room_id': booking_before.room_id,
            'check_in': booking_before.check_in,
            'check_out': booking_before.check_out,
        }
        hotel_id_before = booking_before.room.hotel_id

        cancel_response = self.cancel_booking(booking_id)
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        booking_after = RoomBooking.objects.get(pk=booking_id)
        self.assertEqual(booking_after.guest_name, original_fields['guest_name'])
        self.assertEqual(booking_after.guest_email, original_fields['guest_email'])
        self.assertEqual(booking_after.guest_phone, original_fields['guest_phone'])
        self.assertEqual(booking_after.guest_id, original_fields['guest_id'])
        self.assertEqual(booking_after.room_id, original_fields['room_id'])
        self.assertEqual(booking_after.check_in, original_fields['check_in'])
        self.assertEqual(booking_after.check_out, original_fields['check_out'])
        self.assertEqual(booking_after.room.hotel_id, hotel_id_before)
        self.assertEqual(booking_after.status, 'CANCELLED')
        self.assertEqual(booking_after.id, booking_before.id)

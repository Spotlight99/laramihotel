from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import RoomBooking, Invoice, HouseKeeping
from .services.booking_service import BookingService
from .serializers import (
    RoomBookingSerializer,
    InvoiceSerializer,
    HouseKeepingSerializer
)
from hotel_management.rooms.models import Room


class RoomBookingViewSet(viewsets.ModelViewSet):
    serializer_class = RoomBookingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return RoomBooking.objects.filter(
                guest_id=str(self.request.user.pk)
            )
        return RoomBooking.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            room = Room.objects.get(
                id=serializer.validated_data["room_id"]
            )
        except Room.DoesNotExist:
            return Response(
                {"error": "Room not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        booking = BookingService.create_booking(
            room=room,
            guest_name=serializer.validated_data["guest_name"],
            guest_email=serializer.validated_data["guest_email"],
            guest_phone=serializer.validated_data["guest_phone"],
            guest_id=(
                str(request.user.pk)
                if request.user.is_authenticated
                else ""
            ),
            check_in=serializer.validated_data["check_in"],
            check_out=serializer.validated_data["check_out"],
            number_of_guests=serializer.validated_data.get(
                "number_of_guests", 1
            ),
            special_requests=serializer.validated_data.get(
                "special_requests", ""
            ),
        )

        invoice = booking.invoice

        return Response(
            {
                "booking": RoomBookingSerializer(booking).data,
                "invoice": InvoiceSerializer(invoice).data,
                "payment_link": self._generate_whatsapp_link(
                    booking,
                    invoice
                ),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def search(self, request):
        guest_email = request.query_params.get("email")
        guest_phone = request.query_params.get("phone")

        if not (guest_email or guest_phone):
            return Response(
                {"error": "Email or phone required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        query = Q()

        if guest_email:
            query |= Q(guest_email=guest_email)

        if guest_phone:
            query |= Q(guest_phone=guest_phone)

        bookings = RoomBooking.objects.filter(query)

        return Response(
            RoomBookingSerializer(bookings, many=True).data
        )

    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def payment_link(self, request, pk=None):
        """Generate WhatsApp payment link for a booking"""
        try:
            booking = RoomBooking.objects.get(pk=pk)
            
            # Get or create invoice
            invoice = BookingService.create_invoice(booking)
            
            payment_link = self._generate_whatsapp_link(booking, invoice)
            
            return Response({
                "payment_link": payment_link,
                "booking_id": booking.id,
                "total_amount": float(booking.total_price),
            })
        except RoomBooking.DoesNotExist:
            return Response(
                {"error": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def confirm_payment(self, request, pk=None):
        booking = self.get_object()

        booking.payment_status = "COMPLETED"
        booking.status = "CONFIRMED"
        booking.save()

        if hasattr(booking, "invoice"):
            invoice = booking.invoice
            invoice.payment_status = "COMPLETED"
            invoice.payment_date = timezone.now()
            invoice.save()

        return Response(
            {
                "message": "Payment confirmed",
                "booking": RoomBookingSerializer(booking).data,
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def check_in(self, request, pk=None):
        booking = self.get_object()

        if booking.status != "CONFIRMED":
            return Response(
                {"error": "Only confirmed bookings can be checked in"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "CHECKED_IN"
        booking.save()

        BookingService.create_housekeeping(booking)

        return Response(
            {
                "message": "Guest checked in",
                "booking": RoomBookingSerializer(booking).data,
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def check_out(self, request, pk=None):
        booking = self.get_object()

        booking.status = "CHECKED_OUT"
        booking.save()

        if hasattr(booking, "housekeeping"):
            housekeeping = booking.housekeeping
            housekeeping.status = "COMPLETED"
            housekeeping.check_out_date = timezone.now().date()
            housekeeping.save()

        return Response(
            {
                "message": "Guest checked out",
                "booking": RoomBookingSerializer(booking).data,
            }
        )

    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def cancel(self, request, pk=None):
        """Cancel a booking. Only PENDING and CONFIRMED bookings can be cancelled."""
        try:
            booking = RoomBooking.objects.get(pk=pk)

            # Validate cancellation is allowed
            if booking.status not in ["PENDING", "CONFIRMED"]:
                return Response(
                    {
                        "error": f"Cannot cancel booking with status {booking.status}. "
                        "Only PENDING and CONFIRMED bookings can be cancelled."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update booking status
            booking.status = "CANCELLED"
            booking.save()

            # Update invoice if exists
            if hasattr(booking, "invoice"):
                invoice = booking.invoice
                invoice.payment_status = "CANCELLED"
                invoice.save()

            return Response(
                {
                    "message": "Booking cancelled successfully",
                    "booking": RoomBookingSerializer(booking).data,
                }
            )
        except RoomBooking.DoesNotExist:
            return Response(
                {"error": "Booking not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @staticmethod
    def _generate_whatsapp_link(booking, invoice):
        hotel = booking.room.hotel
        manager_whatsapp = (
            hotel.manager_whatsapp.replace("+", "")
            .replace(" ", "")
            .replace(" ", "")
        )

        message = f"""
*{hotel.name} - Booking Confirmation*

Guest: {booking.guest_name}
Email: {booking.guest_email}
Phone: {booking.guest_phone}
Room: {booking.room.room_number}
Check-in: {booking.check_in}
Check-out: {booking.check_out}
Total: ₦{booking.total_price}
Invoice: {invoice.invoice_number}

Please confirm this booking.
"""

        return (
            f"https://wa.me/{manager_whatsapp}"
            f"?text={message.replace(chr(10), '%0A').replace(' ', '%20')}"
        )


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(
            booking__guest_id=str(self.request.user.pk)
        )


class HouseKeepingViewSet(viewsets.ModelViewSet):
    queryset = HouseKeeping.objects.all()
    serializer_class = HouseKeepingSerializer
    permission_classes = [IsAuthenticated]
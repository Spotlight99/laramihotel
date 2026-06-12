from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import RoomBooking, Invoice, HouseKeeping
from .serializers import (
    RoomBookingSerializer,
    InvoiceSerializer,
    HouseKeepingSerializer
)
from hotel_management.rooms.models import Room
import uuid


class RoomBookingViewSet(viewsets.ModelViewSet):
    serializer_class = RoomBookingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return RoomBooking.objects.filter(
                guest_id=str(self.request.user.pk)
            )
        return RoomBooking.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            room = Room.objects.get(
                id=serializer.validated_data["room_id"]
            )
        except Room.DoesNotExist:
            return Response(
                {"error": "Room not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        booking = RoomBooking.objects.create(
            guest_name=serializer.validated_data["guest_name"],
            guest_email=serializer.validated_data["guest_email"],
            guest_phone=serializer.validated_data["guest_phone"],
            guest_id=(
                str(request.user.pk)
                if request.user.is_authenticated
                else ""
            ),
            room=room,
            check_in=serializer.validated_data["check_in"],
            check_out=serializer.validated_data["check_out"],
            number_of_guests=serializer.validated_data.get(
                "number_of_guests", 1
            ),
            special_requests=serializer.validated_data.get(
                "special_requests", ""
            ),
        )

        booking.calculate_total()
        booking.save()

        invoice = Invoice.objects.create(
            booking=booking,
            invoice_number=f"INV-{booking.id}-{uuid.uuid4().hex[:6].upper()}",
            room_charge=booking.total_price,
            total_amount=booking.total_price,
            payment_method="WHATSAPP",
        )

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

        HouseKeeping.objects.create(
            booking=booking,
            room=booking.room,
            status="IN_PROGRESS",
        )

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

    @staticmethod
    def _generate_whatsapp_link(booking, invoice):
        from django.conf import settings

        manager_whatsapp = settings.MANAGER_WHATSAPP

        message = f"""
*Larami Holiday Hotel - Booking Confirmation*

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
from rest_framework import serializers
from .models import RoomBooking, Invoice, HouseKeeping
from hotel_management.rooms.serializers import RoomSerializer


class RoomBookingSerializer(serializers.ModelSerializer):
    room = RoomSerializer(read_only=True)
    room_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = RoomBooking
        fields = [
            "id",
            "guest_name",
            "guest_email",
            "guest_phone",
            "guest_id",
            "room",
            "room_id",
            "check_in",
            "check_out",
            "number_of_guests",
            "special_requests",
            "status",
            "total_price",
            "number_of_nights",
            "payment_status",
            "payment_reference",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "guest_id",
            "status",
            "total_price",
            "number_of_nights",
            "payment_status",
            "payment_reference",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        check_in = attrs.get("check_in")
        check_out = attrs.get("check_out")
        room_id = attrs.get("room_id")

        # Validate date logic
        if check_in and check_out:
            if check_out <= check_in:
                raise serializers.ValidationError(
                    "Check-out date must be after check-in date."
                )

        # Validate room availability (prevent double booking)
        if room_id and check_in and check_out:
            active_bookings = RoomBooking.objects.filter(
                room_id=room_id
            ).exclude(
                status__in=["CANCELLED", "CHECKED_OUT"]
            )
            
            # Check for overlapping dates
            overlap_exists = active_bookings.filter(
                check_in__lt=check_out,
                check_out__gt=check_in
            ).exists()
            
            if overlap_exists:
                raise serializers.ValidationError(
                    "This room is already booked for the selected dates."
                )

        return attrs


class InvoiceSerializer(serializers.ModelSerializer):
    booking = RoomBookingSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "booking",
            "invoice_number",
            "room_charge",
            "additional_charges",
            "discount",
            "total_amount",
            "payment_method",
            "payment_status",
            "payment_date",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "invoice_number",
            "created_at",
            "updated_at",
        ]


class HouseKeepingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseKeeping
        fields = [
            "id",
            "booking",
            "room",
            "check_in_date",
            "check_out_date",
            "status",
            "notes",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "created_at",
            "updated_at",
        ]
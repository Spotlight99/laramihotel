from django.db import models
from hotel_management.rooms.models import Room
from decimal import Decimal

BOOKING_STATUS = [
    ('PENDING', 'Pending'),
    ('CONFIRMED', 'Confirmed'),
    ('CHECKED_IN', 'Checked In'),
    ('CHECKED_OUT', 'Checked Out'),
    ('CANCELLED', 'Cancelled'),
]

PAYMENT_STATUS = [
    ('PENDING', 'Pending Payment'),
    ('PROCESSING', 'Processing'),
    ('COMPLETED', 'Completed'),
    ('FAILED', 'Failed'),
]

class RoomBooking(models.Model):
    # Guest Information
    guest_name = models.CharField(max_length=255)
    guest_email = models.EmailField()
    guest_phone = models.CharField(max_length=20)
    guest_id = models.CharField(max_length=100, blank=True)  # Supabase user ID
    
    # Booking Details
    room = models.ForeignKey(Room, on_delete=models.CASCADE, 
                             related_name='bookings')
    check_in = models.DateField()
    check_out = models.DateField()
    number_of_guests = models.IntegerField(default=1)
    special_requests = models.TextField(blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=BOOKING_STATUS, default='PENDING')
    
    # Payment Information
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    number_of_nights = models.IntegerField(default=1)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    payment_reference = models.CharField(max_length=100, blank=True)  # Paystack or WhatsApp reference
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.guest_name} - Room {self.room.room_number} ({self.check_in} to {self.check_out})"

class Invoice(models.Model):
    booking = models.OneToOneField(RoomBooking, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True)
    
    # Items
    room_charge = models.DecimalField(max_digits=10, decimal_places=2)
    additional_charges = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Payment
    payment_method = models.CharField(max_length=50, choices=[('WHATSAPP', 'WhatsApp'), ('PAYSTACK', 'Paystack')])
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    payment_date = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"

class HouseKeeping(models.Model):
    booking = models.OneToOneField(RoomBooking, on_delete=models.CASCADE, related_name='housekeeping')
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    check_in_date = models.DateField(auto_now_add=True)
    check_out_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('IN_PROGRESS', 'In Progress'),
            ('COMPLETED', 'Completed'),
        ],
        default='PENDING'
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Housekeeping - Room {self.room.room_number}"

from django.contrib import admin
from .models import RoomBooking, Invoice, HouseKeeping

@admin.register(RoomBooking)
class RoomBookingAdmin(admin.ModelAdmin):
    list_display = ['guest_name', 'room', 'check_in', 'check_out', 'status', 'payment_status']
    list_filter = ['status', 'payment_status', 'created_at']
    search_fields = ['guest_name', 'guest_email', 'room__room_number']
    readonly_fields = ['guest_id', 'total_price', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Guest Info', {'fields': ('guest_name', 'guest_email', 'guest_phone', 'guest_id')}),
        ('Booking Details', {'fields': ('room', 'check_in', 'check_out', 'number_of_guests', 'special_requests')}),
        ('Status & Payment', {'fields': ('status', 'payment_status', 'total_price', 'payment_reference')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'booking', 'total_amount', 'payment_status', 'created_at']
    list_filter = ['payment_status', 'payment_method', 'created_at']
    search_fields = ['invoice_number', 'booking__guest_name']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']

@admin.register(HouseKeeping)
class HouseKeepingAdmin(admin.ModelAdmin):
    list_display = ['booking', 'room', 'status', 'check_in_date', 'check_out_date']
    list_filter = ['status', 'created_at']
    search_fields = ['room__room_number', 'booking__guest_name']

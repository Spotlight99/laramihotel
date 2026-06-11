from django.contrib import admin
from .models import Hotel, Room

@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email']
    fieldsets = (
        ('Hotel Info', {'fields': ('name', 'address')}),
        ('Contact', {'fields': ('phone', 'email', 'manager_whatsapp')}),
    )

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['room_number', 'room_type', 'price_per_night', 'status', 'capacity']
    list_filter = ['room_type', 'status']
    search_fields = ['room_number']
    fieldsets = (
        ('Room Details', {'fields': ('hotel', 'room_number', 'room_type', 'capacity')}),
        ('Pricing & Status', {'fields': ('price_per_night', 'status')}),
        ('Amenities', {'fields': ('amenities', 'description')}),
        ('Media', {'fields': ('image_url',)}),
    )

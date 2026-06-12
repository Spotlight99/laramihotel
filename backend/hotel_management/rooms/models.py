from django.db import models

ROOM_TYPES = [
    ('STANDARD', 'Standard Room - ₦25,000/night'),
    ('DELUXE', 'Deluxe Room - ₦35,000/night'),
    ('EXECUTIVE', 'Executive Room - ₦45,000/night'),
    ('SUITE', 'Suite - ₦60,000/night'),
    ('STUDIO', 'Studio - ₦20,000/night'),
]

ROOM_STATUS = [
    ('AVAILABLE', 'Available'),
    ('OCCUPIED', 'Occupied'),
    ('MAINTENANCE', 'Maintenance'),
    ('RESERVED', 'Reserved'),
]

class Hotel(models.Model):
    name = models.CharField(max_length=255, default='Larami Holiday Hotel')
    address = models.TextField(default='No 10 Chief Chung Street, Aleto Eleme, Rivers State')
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    manager_whatsapp = models.CharField(max_length=20)
    
    class Meta:
        verbose_name_plural = "Hotels"
    
    def __str__(self):
        return self.name

class Room(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=10, unique=True)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=ROOM_STATUS, default='AVAILABLE')
    capacity = models.IntegerField(default=2)
    amenities = models.TextField(blank=True)  # List of amenities like WiFi, AC, TV
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['room_number']
    
    def __str__(self):
        return f"Room {self.room_number} - {self.get_room_type_display()}"

from rest_framework import serializers
from .models import Hotel, Room

class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ['id', 'name', 'address', 'phone', 'email', 'manager_whatsapp']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            'id', 'room_number', 'room_type', 'price_per_night', 
            'status', 'capacity', 'amenities', 'description', 
            'image_url', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class RoomDetailSerializer(serializers.ModelSerializer):
    hotel = HotelSerializer(read_only=True)
    
    class Meta:
        model = Room
        fields = '__all__'

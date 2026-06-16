from rest_framework import serializers
from .models import Hotel, Room

class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ['id', 'name', 'address', 'phone', 'email', 'manager_whatsapp']

class RoomSerializer(serializers.ModelSerializer):
    # Convert amenities string to array for frontend compatibility
    amenities = serializers.SerializerMethodField()
    
    def get_amenities(self, obj):
        """Convert amenities string to array of strings"""
        if not obj.amenities:
            return []
        # Split by comma and clean up whitespace
        return [a.strip() for a in obj.amenities.split(',') if a.strip()]
    
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
    # Convert amenities string to array for frontend compatibility
    amenities = serializers.SerializerMethodField()
    
    def get_amenities(self, obj):
        """Convert amenities string to array of strings"""
        if not obj.amenities:
            return []
        # Split by comma and clean up whitespace
        return [a.strip() for a in obj.amenities.split(',') if a.strip()]
    
    class Meta:
        model = Room
        fields = '__all__'

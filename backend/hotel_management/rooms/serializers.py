from rest_framework import serializers
from .models import Hotel, Room
import json

# Default fallback images for room types
DEFAULT_IMAGES = {
    'STANDARD': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80&auto=format&fit=crop',
    'DELUXE': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80&auto=format&fit=crop',
    'EXECUTIVE': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80&auto=format&fit=crop',
    'SUITE': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80&auto=format&fit=crop',
    'STUDIO': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80&auto=format&fit=crop',
}

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
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Convert amenities to array and provide image URL with fallback on read"""
        data = super().to_representation(instance)
        
        # Convert amenities string to array for frontend compatibility
        if instance.amenities:
            amenities_str = instance.amenities.strip()
            # Try to parse as JSON if it looks like JSON
            if amenities_str.startswith('['):
                try:
                    data['amenities'] = json.loads(amenities_str)
                except (json.JSONDecodeError, ValueError):
                    data['amenities'] = [a.strip() for a in amenities_str.split(',') if a.strip()]
            else:
                # Split by comma and clean up
                data['amenities'] = [a.strip() for a in amenities_str.split(',') if a.strip()]
        else:
            data['amenities'] = []
        
        # Provide image URL with fallback to default based on room type
        if not instance.image_url:
            data['image_url'] = DEFAULT_IMAGES.get(instance.room_type, DEFAULT_IMAGES['STANDARD'])
        
        return data

class RoomDetailSerializer(serializers.ModelSerializer):
    hotel = HotelSerializer(read_only=True)
    
    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'hotel']
    
    def to_representation(self, instance):
        """Convert amenities to array and provide image URL with fallback on read"""
        data = super().to_representation(instance)
        
        # Convert amenities string to array for frontend compatibility
        if instance.amenities:
            amenities_str = instance.amenities.strip()
            # Try to parse as JSON if it looks like JSON
            if amenities_str.startswith('['):
                try:
                    data['amenities'] = json.loads(amenities_str)
                except (json.JSONDecodeError, ValueError):
                    data['amenities'] = [a.strip() for a in amenities_str.split(',') if a.strip()]
            else:
                # Split by comma and clean up
                data['amenities'] = [a.strip() for a in amenities_str.split(',') if a.strip()]
        else:
            data['amenities'] = []
        
        # Provide image URL with fallback to default based on room type
        if not instance.image_url:
            data['image_url'] = DEFAULT_IMAGES.get(instance.room_type, DEFAULT_IMAGES['STANDARD'])
        
        return data

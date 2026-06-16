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
    # Convert amenities string to array for frontend compatibility
    amenities = serializers.SerializerMethodField()
    # Provide image URL with fallback
    image_url = serializers.SerializerMethodField()
    
    def get_amenities(self, obj):
        """Convert amenities to array, handling multiple formats"""
        if not obj.amenities:
            return []
        
        amenities_str = obj.amenities.strip()
        
        # Try to parse as JSON if it looks like JSON
        if amenities_str.startswith('['):
            try:
                return json.loads(amenities_str)
            except (json.JSONDecodeError, ValueError):
                pass
        
        # Otherwise split by comma and clean up
        return [a.strip() for a in amenities_str.split(',') if a.strip()]
    
    def get_image_url(self, obj):
        """Return image URL with fallback to default based on room type"""
        if obj.image_url:
            return obj.image_url
        # Return default image for room type, or generic fallback
        return DEFAULT_IMAGES.get(obj.room_type, DEFAULT_IMAGES['STANDARD'])
    
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
    # Provide image URL with fallback
    image_url = serializers.SerializerMethodField()
    
    def get_amenities(self, obj):
        """Convert amenities to array, handling multiple formats"""
        if not obj.amenities:
            return []
        
        amenities_str = obj.amenities.strip()
        
        # Try to parse as JSON if it looks like JSON
        if amenities_str.startswith('['):
            try:
                return json.loads(amenities_str)
            except (json.JSONDecodeError, ValueError):
                pass
        
        # Otherwise split by comma and clean up
        return [a.strip() for a in amenities_str.split(',') if a.strip()]
    
    def get_image_url(self, obj):
        """Return image URL with fallback to default based on room type"""
        if obj.image_url:
            return obj.image_url
        # Return default image for room type, or generic fallback
        return DEFAULT_IMAGES.get(obj.room_type, DEFAULT_IMAGES['STANDARD'])
    
    class Meta:
        model = Room
        fields = '__all__'

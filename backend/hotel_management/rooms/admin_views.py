from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.files.storage import default_storage
from .models import Room, Hotel
from .serializers import RoomSerializer, RoomDetailSerializer, HotelSerializer
from ..api.authentication import SupabaseAuthentication
from uuid import uuid4
import os


class AdminRoomViewSet(viewsets.ModelViewSet):
    """
    Admin endpoints for room management.
    Requires Supabase authentication.
    """
    queryset = Room.objects.all()
    serializer_class = RoomDetailSerializer
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        """Use detail serializer for all operations"""
        return RoomDetailSerializer
    
    def perform_create(self, serializer):
        """Automatically assign hotel when creating room"""
        # Get or create default hotel
        hotel, _ = Hotel.objects.get_or_create(
            id=1,
            defaults={
                'name': 'Larami Holiday Hotel',
                'address': 'No 10 Chief Chung Street, Aleto Eleme, Rivers State',
                'phone': '',
                'email': '',
                'manager_whatsapp': ''
            }
        )
        serializer.save(hotel=hotel)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_image(self, request):
        """Upload room image"""
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            image_file = request.FILES['image']
            
            # Generate unique filename
            file_ext = os.path.splitext(image_file.name)[1]
            filename = f"rooms/{uuid4()}{file_ext}"
            
            # Save to storage
            file_path = default_storage.save(filename, image_file)
            file_url = default_storage.url(file_path)
            
            return Response({
                'url': file_url,
                'filename': filename,
                'message': 'Image uploaded successfully'
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_amenities(self, request, pk=None):
        """Update room amenities"""
        try:
            room = self.get_object()
            amenities = request.data.get('amenities', [])
            
            # Convert list to comma-separated string
            if isinstance(amenities, list):
                room.amenities = ', '.join(amenities)
            else:
                room.amenities = amenities
            
            room.save()
            
            return Response(
                RoomDetailSerializer(room).data,
                status=status.HTTP_200_OK
            )
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminHotelViewSet(viewsets.ViewSet):
    """
    Admin endpoints for hotel information management.
    Requires Supabase authentication.
    """
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser,)
    
    def list(self, request):
        """Get hotel information"""
        hotel = Hotel.objects.first()
        if not hotel:
            return Response(
                {'error': 'Hotel not configured'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = HotelSerializer(hotel)
        return Response(serializer.data)
    
    def partial_update(self, request):
        """Update hotel information"""
        try:
            hotel = Hotel.objects.first()
            if not hotel:
                hotel = Hotel.objects.create(
                    name=request.data.get('name', 'Larami Holiday Hotel'),
                    address=request.data.get('address', ''),
                    phone=request.data.get('phone', ''),
                    email=request.data.get('email', ''),
                    manager_whatsapp=request.data.get('manager_whatsapp', '')
                )
            else:
                hotel.name = request.data.get('name', hotel.name)
                hotel.address = request.data.get('address', hotel.address)
                hotel.phone = request.data.get('phone', hotel.phone)
                hotel.email = request.data.get('email', hotel.email)
                hotel.manager_whatsapp = request.data.get('manager_whatsapp', hotel.manager_whatsapp)
                hotel.save()
            
            return Response(
                HotelSerializer(hotel).data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

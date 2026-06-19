from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from supabase import create_client
from django.conf import settings
from django.urls import reverse
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
            
            # Validate file size (max 20MB)
            MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
            if image_file.size > MAX_FILE_SIZE:
                size_mb = image_file.size / (1024 * 1024)
                return Response(
                    {'error': f'Image is too large ({size_mb:.1f}MB). Maximum allowed is 20MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate unique filename
            file_ext = os.path.splitext(image_file.name)[1]
            filename = f"rooms/{uuid4()}{file_ext}"
            
           # Upload to Supabase Storage
           
            supabase = create_client(
               settings.SUPABASE_URL,
               settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY
            )

            bucket = settings.SUPABASE_STORAGE_BUCKET

            image_file.seek(0)
            file_bytes = image_file.read()
            print("FILE NAME:", image_file.name)
            print("CONTENT TYPE:", image_file.content_type)
            print("FILE BYTES TYPE:", type(file_bytes))
            print("FILE SIZE:", len(file_bytes))
            print("BUCKET:", bucket)
            print("Starting Supabase upload...")
            try:
                result = supabase.storage.from_(bucket).upload(
                   filename,
                   file_bytes,
                    {
                       "content-type": image_file.content_type,
                       "upsert": "true"
                    }
                )
                print("UPLOAD RESULT:", result)
            except Exception as e:
                print("SUPASE ERROR:", str(e))
                raise
             

            file_url = supabase.storage.from_(bucket).get_public_url(filename)
            
            return Response({
                'url': file_url,
                'filename': filename,
                'message': 'Image uploaded successfully'
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
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

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from datetime import datetime, timedelta
from .models import Room, Hotel
from .serializers import RoomSerializer, RoomDetailSerializer, HotelSerializer

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['room_number', 'room_type']
    ordering_fields = ['price_per_night', 'room_type']
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def available(self, request):
        """Get available rooms for specific dates"""
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        room_type = request.query_params.get('room_type')
        
        try:
            check_in_date = datetime.strptime(check_in, '%Y-%m-%d') if check_in else datetime.now()
            check_out_date = datetime.strptime(check_out, '%Y-%m-%d') if check_out else datetime.now() + timedelta(days=1)
        except ValueError:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get rooms that are available and not booked during this period
        rooms = Room.objects.filter(status='AVAILABLE')
        
        if room_type:
            rooms = rooms.filter(room_type=room_type)
        
        # Filter out rooms with conflicting bookings
        from bookings.models import RoomBooking
        conflicting_bookings = RoomBooking.objects.filter(
            check_in__lt=check_out_date,
            check_out__gt=check_in_date,
            status__in=['CONFIRMED', 'CHECKED_IN']
        )
        rooms = rooms.exclude(roombooking__in=conflicting_bookings)
        
        serializer = RoomDetailSerializer(rooms, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def hotel_info(self, request):
        """Get hotel information"""
        hotel = Hotel.objects.first()
        if not hotel:
            return Response({'error': 'Hotel not configured'}, status=status.HTTP_404_NOT_FOUND)
        serializer = HotelSerializer(hotel)
        return Response(serializer.data)

class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [AllowAny]

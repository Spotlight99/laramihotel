from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import RoomBooking, Invoice
from .serializers import RoomBookingSerializer, InvoiceSerializer
from ..api.authentication import SupabaseAuthentication
from django.utils import timezone


class AdminBookingViewSet(viewsets.ModelViewSet):
    """
    Admin endpoints for booking management.
    Requires Supabase authentication.
    Only managers can view and manage all bookings.
    """
    queryset = RoomBooking.objects.all().order_by('-created_at')
    serializer_class = RoomBookingSerializer
    authentication_classes = [SupabaseAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return all bookings for admin view"""
        return RoomBooking.objects.all().order_by('-created_at')
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def confirm_booking(self, request, pk=None):
        """
        Confirm a booking and mark room as unavailable.
        Called when manager confirms the order.
        """
        try:
            booking = self.get_object()
            
            if booking.status == 'CONFIRMED':
                return Response(
                    {'error': 'Booking already confirmed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark booking as confirmed
            booking.status = 'CONFIRMED'
            booking.save()
            
            # Mark room as unavailable (occupied/booked)
            from hotel_management.rooms.models import Room
            booking.room.status = 'RESERVED'
            booking.room.save()
            
            return Response({
                'booking': RoomBookingSerializer(booking).data,
                'message': 'Booking confirmed and room marked as unavailable',
                'room_status': booking.room.status
            }, status=status.HTTP_200_OK)
        
        except RoomBooking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def checkout_guest(self, request, pk=None):
        """
        Mark guest as checked out.
        Room becomes available again.
        """
        try:
            booking = self.get_object()
            
            if booking.status != 'CHECKED_IN':
                return Response(
                    {'error': f'Cannot checkout from status: {booking.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark booking as completed
            booking.status = 'COMPLETED'
            booking.checkout_date = timezone.now().date()
            booking.save()
            
            # Mark room as available again
            from hotel_management.rooms.models import Room
            booking.room.status = 'AVAILABLE'
            booking.room.save()
            
            return Response({
                'booking': RoomBookingSerializer(booking).data,
                'message': 'Guest checked out successfully',
                'room_status': booking.room.status
            }, status=status.HTTP_200_OK)
        
        except RoomBooking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def cancel_booking(self, request, pk=None):
        """
        Cancel a booking.
        Room becomes available again if it was reserved.
        """
        try:
            booking = self.get_object()
            
            if booking.status in ['COMPLETED', 'CANCELLED']:
                return Response(
                    {'error': f'Cannot cancel booking with status: {booking.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark booking as cancelled
            booking.status = 'CANCELLED'
            booking.save()
            
            # Mark room as available if it was reserved
            from hotel_management.rooms.models import Room
            if booking.room.status == 'RESERVED':
                booking.room.status = 'AVAILABLE'
                booking.room.save()
            
            return Response({
                'booking': RoomBookingSerializer(booking).data,
                'message': 'Booking cancelled successfully',
                'room_status': booking.room.status
            }, status=status.HTTP_200_OK)
        
        except RoomBooking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def statistics(self, request):
        """Get booking statistics for dashboard"""
        total_bookings = RoomBooking.objects.count()
        confirmed_bookings = RoomBooking.objects.filter(status='CONFIRMED').count()
        checked_in = RoomBooking.objects.filter(status='CHECKED_IN').count()
        pending = RoomBooking.objects.filter(status='PENDING').count()
        
        return Response({
            'total_bookings': total_bookings,
            'confirmed_bookings': confirmed_bookings,
            'checked_in': checked_in,
            'pending': pending,
            'occupancy_rate': f"{(confirmed_bookings + checked_in) / max(total_bookings, 1) * 100:.1f}%"
        })

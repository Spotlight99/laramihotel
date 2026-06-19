from django.urls import path, include
from rest_framework.routers import DefaultRouter
from hotel_management.rooms.admin_views import AdminRoomViewSet, AdminHotelViewSet
from hotel_management.bookings.admin_views import AdminBookingViewSet


# Admin router for manager endpoints
admin_router = DefaultRouter()
admin_router.register(r'rooms', AdminRoomViewSet, basename='admin-room')
admin_router.register(r'hotel', AdminHotelViewSet, basename='admin-hotel')
admin_router.register(r'bookings', AdminBookingViewSet, basename='admin-booking')

urlpatterns = [
    path('', include(admin_router.urls)),
]

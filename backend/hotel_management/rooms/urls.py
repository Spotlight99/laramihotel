from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, HotelViewSet

router = DefaultRouter()

router.register(r'', RoomViewSet, basename='room')
router.register(r'hotels', HotelViewSet, basename='hotel')

urlpatterns = [
path('', include(router.urls)),
]

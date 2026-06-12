from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomViewSet, HotelViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'hotels', HotelViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
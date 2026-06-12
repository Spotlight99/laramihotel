from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomBookingViewSet, InvoiceViewSet, HouseKeepingViewSet

router = DefaultRouter()

router.register(
    r'',
    RoomBookingViewSet,
    basename='booking'
)

router.register(
    r'invoices',
    InvoiceViewSet,
    basename='invoice'
)

router.register(
    r'housekeeping',
    HouseKeepingViewSet,
    basename='housekeeping'
)

urlpatterns = [
    path('', include(router.urls)),
]
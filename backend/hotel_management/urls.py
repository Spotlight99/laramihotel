from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from hotel_management.rooms.views import debug_rooms



from django.http import JsonResponse

def home(request):
    return JsonResponse({
        "message": "Larami Hotel API",
        "status": "online"
    })

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/", include("hotel_management.api.urls")),
    path("api/rooms/", include("hotel_management.rooms.urls")),
    path("api/bookings/", include("hotel_management.bookings.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


urlpatterns += [
    path("debug/", debug_rooms),
]
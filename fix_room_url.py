#!/usr/bin/env python
import os
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_management.settings')
BASE_DIR = Path(__file__).resolve().parent
os.environ.setdefault('SECRET_KEY', 'django-insecure-development-key-change-in-production')

import django
django.setup()

from hotel_management.rooms.models import Room

# Fix Room 01's image URL
room = Room.objects.filter(room_number="01").first()
if room and room.image_url:
    old_url = room.image_url
    # Add /media/ if it's missing
    if '/media/' not in old_url and old_url.startswith('https://'):
        # Replace /rooms/ with /media/rooms/
        new_url = old_url.replace('laramihotel.onrender.com/rooms/', 'laramihotel.onrender.com/media/rooms/')
        room.image_url = new_url
        room.save()
        print(f"✓ Updated Room 01 image URL")
        print(f"  Old: {old_url}")
        print(f"  New: {new_url}")
    else:
        print(f"Room 01 URL already has /media/ or is not an absolute URL: {old_url}")
else:
    print("Room 01 not found or has no image")

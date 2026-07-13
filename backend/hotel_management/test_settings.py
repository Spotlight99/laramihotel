from .settings import *

# Use an in-memory SQLite database for tests to avoid external DB dependencies
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Keep other settings the same as base settings
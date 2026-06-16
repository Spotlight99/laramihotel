import os
from pathlib import Path
from decouple import config
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-development-key-change-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = str(config('DJANGO_ALLOWED_HOSTS', default='localhost,127.0.0.1')).split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'hotel_management.rooms',
    'hotel_management.bookings',
    'hotel_management.api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'hotel_management.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'hotel_management.wsgi.application'

# Database - Using Supabase PostgreSQL
import dj_database_url

DATABASES = {
    "default": dj_database_url.parse(
        str(config("DATABASE_URL")),
        conn_max_age=600,
        ssl_require=True,
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = (
    'whitenoise.storage.CompressedManifestStaticFilesStorage')
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'hotel_management.api.authentication.SupabaseAuthentication',
    ],
    # Allow unauthenticated access by default (endpoints can override with permission_classes)
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS Configuration - Critical for frontend-backend communication
CORS_ALLOWED_ORIGINS = str(config('CORS_ALLOWED_ORIGINS', default=(
    'http://localhost:3000,'
    'https://laramihotel-8x64f43ry.vercel.app,'
    'https://laramihotel.vercel.app'
))).split(',')

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'content-type',
    'accept',
    'origin',
    'authorization',
]

# Security: Allow all hosts (or restrict as needed)
ALLOWED_HOSTS = ["*"]

# Supabase Configuration
SUPABASE_URL = config('SUPABASE_URL', default='')
SUPABASE_KEY = config('SUPABASE_KEY', default='')
SUPABASE_SERVICE_KEY = config('SUPABASE_SERVICE_KEY', default='')

# WhatsApp Configuration
MANAGER_WHATSAPP = config('MANAGER_WHATSAPP', default='2348146800508')
HOTEL_CURRENCY = config('HOTEL_CURRENCY', default='NGN')

LOGGING = {
"version": 1,
"disable_existing_loggers": False,
"handlers": {
"console": {
"class": "logging.StreamHandler",
},
},
"root": {
"handlers": ["console"],
"level": "WARNING",
},
"loggers": {
"django": {
"handlers": ["console"],
"level": "ERROR",
"propagate": False,
},
"hotel_management": {
"handlers": ["console"],
"level": "DEBUG",
"propagate": False,
},
},
}

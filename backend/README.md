# Larami Holiday Hotel - Backend API

Django REST API for hotel management system.

## Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

**Required Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_KEY` - Your Supabase service key
- `MANAGER_WHATSAPP` - Hotel manager's WhatsApp number (+2348146800508)

### 3. Database Setup
```bash
python manage.py migrate
```

### 4. Create Superuser (Admin)
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

Server runs at `http://localhost:8000`

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - Register new user
- `POST /api/auth/login/` - Login with email/password
- `POST /api/auth/send_otp/` - Send OTP for passwordless login
- `POST /api/auth/verify_otp/` - Verify OTP
- `POST /api/auth/refresh_token/` - Refresh access token

### Rooms
- `GET /api/rooms/` - List all rooms
- `GET /api/rooms/available/?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD` - Get available rooms
- `GET /api/rooms/hotel_info/` - Get hotel information

### Bookings (Guest)
- `POST /api/bookings/` - Create new booking
- `GET /api/bookings/search/?email=guest@email.com` - Search bookings
- `GET /api/bookings/{id}/` - Get booking details

### Bookings (Manager/Receptionist)
- `POST /api/bookings/{id}/confirm_payment/` - Confirm WhatsApp payment
- `POST /api/bookings/{id}/check_in/` - Check-in guest
- `POST /api/bookings/{id}/check_out/` - Check-out guest

### Invoices
- `GET /api/bookings/invoices/` - List invoices
- `GET /api/bookings/invoices/{id}/` - Get invoice details

### Housekeeping
- `GET /api/bookings/housekeeping/` - List housekeeping tasks
- `PATCH /api/bookings/housekeeping/{id}/` - Update housekeeping status

## Deployment

### Deploy to Railway/Render
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables
4. Deploy

## Project Structure
```
backend/
├── hotel_management/       # Django project
│   ├── settings.py        # Main settings
│   ├── urls.py            # URL routing
│   └── wsgi.py            # WSGI app
├── rooms/                 # Room management app
│   ├── models.py
│   ├── views.py
│   └── serializers.py
├── bookings/              # Booking management app
│   ├── models.py
│   ├── views.py
│   └── serializers.py
├── api/                   # Authentication & API
│   ├── authentication.py  # Supabase auth
│   ├── views.py
│   └── urls.py
└── manage.py              # Django CLI
```

## Notes
- Database uses PostgreSQL (via Supabase)
- Authentication via Supabase JWT
- Payment redirects to WhatsApp (Manager handles)
- Paystack integration ready (placeholder for future)

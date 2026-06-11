# Larami Holiday Hotel - Complete Setup Guide

## 🎯 Project Overview

Full-stack hotel management system for Larami Holiday Hotel with:
- **Frontend**: Next.js + TypeScript booking website
- **Backend**: Django REST API with PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with JWT
- **Payments**: WhatsApp redirect (Manager handles) → Paystack-ready

---

## 📁 Project Structure

```
larami/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Homepage (already branded)
│   ├── booking/
│   │   └── page.tsx             # Booking form & confirmation
│   ├── admin/
│   │   ├── login/
│   │   └── dashboard/           # Admin dashboard (Receptionist/Manager)
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── Hero.tsx                 # With "By Kelvina" subtitle
│   ├── Navbar.tsx               # With LH logo
│   ├── Rooms.tsx
│   ├── Facilities.tsx           # Updated with real amenities
│   ├── Location.tsx             # Aleto Eleme address
│   ├── Testimonials.tsx
│   ├── Contact.tsx
│   ├── Footer.tsx               # With correct branding
│   └── BookingSearch.tsx        # NEW - Room search component
├── lib/
│   ├── supabase.ts              # Supabase config
│   ├── api.ts                   # NEW - API service layer
│   └── authContext.tsx          # NEW - Auth context with Supabase
├── public/
├── backend/                      # NEW - Django backend
│   ├── hotel_management/        # Django project
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── __init__.py
│   ├── rooms/                   # Room management app
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── admin.py
│   │   └── urls.py
│   ├── bookings/                # Booking management app
│   │   ├── models.py            # RoomBooking, Invoice, HouseKeeping
│   │   ├── views.py
│   │   ├── serializers.py
│   │   ├── admin.py
│   │   └── urls.py
│   ├── api/                     # Authentication & API
│   │   ├── authentication.py    # Supabase JWT auth
│   │   ├── views.py            # Auth endpoints
│   │   ├── urls.py
│   │   └── apps.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile                 # For Vercel deployment
│   ├── runtime.txt
│   ├── .env.example
│   └── README.md
├── FRONTEND_SETUP.md
├── package.json                 # Updated with dependencies
├── tsconfig.json
└── .env.local.example          # NEW

```

---

## 🚀 Quick Start

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env.local
cp .env.local.example .env.local

# Update with your API URL
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Run dev server
npm run dev
```

Frontend runs at `http://localhost:3000`

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Update with Supabase credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run dev server
python manage.py runserver
```

Backend API runs at `http://localhost:8000/api`

---

## 🔑 Configuration

### Backend `.env`

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,*.vercel.app

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Database
# Get from Supabase → Database → Connection Pooling
# Format: postgresql://user:password@host:port/database
# NOTE: URL-encode special characters (@ becomes %40)
DATABASE_URL=postgresql://postgres:your-password@db.supabase.co:5432/postgres

# WhatsApp
MANAGER_WHATSAPP=2348146800508
HOTEL_CURRENCY=NGN

# CORS
FRONTEND_URL=http://localhost:3000,https://larami-holiday.vercel.app
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🔄 Booking Flow

1. **Guest** visits website and searches for rooms
2. **Guest** selects room and fills booking form
3. **System** generates WhatsApp link to manager
4. **Guest** is shown booking confirmation with WhatsApp button
5. **Manager** receives WhatsApp message with booking details
6. **Manager** confirms payment on WhatsApp
7. **Manager** updates status in admin dashboard
8. **System** marks booking as CONFIRMED
9. **Receptionist** checks in guest on arrival

---

## 📊 Database Models

### Rooms
- Hotel
- Room (Standard, Deluxe, Executive, Suite, Studio)

### Bookings
- RoomBooking (guest info, dates, status)
- Invoice (payment details, amount)
- HouseKeeping (cleaning status, notes)

### Auth
- Supabase User (email, password, OTP)

---

## 🔐 User Roles

1. **Guest**: Search rooms, create booking, view confirmation
2. **Manager**: Approve WhatsApp payments, manage staff
3. **Receptionist**: Check-in/out guests, manage bookings
4. **Housekeeper**: Track room cleaning (future)
5. **System**: Automated notifications, payments

---

## 🛠️ API Endpoints

### Rooms
- `GET /api/rooms/` - List all rooms
- `GET /api/rooms/available/?check_in=YYYY-MM-DD&check_out=YYYY-MM-DD` - Search available
- `GET /api/rooms/hotel_info/` - Get hotel details

### Bookings (Guest)
- `POST /api/bookings/` - Create booking
- `GET /api/bookings/search/?email=guest@email.com` - Search own bookings

### Bookings (Manager/Receptionist)
- `POST /api/bookings/{id}/confirm_payment/` - Confirm WhatsApp payment
- `POST /api/bookings/{id}/check_in/` - Check-in guest
- `POST /api/bookings/{id}/check_out/` - Check-out guest

### Auth
- `POST /api/auth/signup/` - Register
- `POST /api/auth/login/` - Login
- `POST /api/auth/send_otp/` - Send OTP
- `POST /api/auth/verify_otp/` - Verify OTP
- `POST /api/auth/refresh_token/` - Refresh JWT

---

## 💳 Payment Flow

### Current (WhatsApp)
1. Guest clicks "Complete Payment on WhatsApp"
2. Manager's WhatsApp opens with booking details
3. Guest sends payment confirmation
4. Manager verifies and updates admin dashboard
5. Receptionist sees confirmed booking

### Future (Paystack)
- Payment infrastructure ready in code
- Just add Paystack API key and webhook handler
- Auto-confirm bookings on payment

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Push to GitHub
git push

# Auto-deployed from git
# Update NEXT_PUBLIC_API_URL to production backend URL
```

### Backend (Railway/Render)
```bash
# Create account on Railway or Render
# Connect GitHub repository
# Set environment variables
# Auto-deployed
```

---

## 🎨 Features Implemented

✅ Hotel branding (Larami Holiday Hotel)
✅ "By Kelvina" subtitle
✅ Correct address (Aleto Eleme)
✅ Real amenities (Restaurant, Lounge, Karaoke, etc.)
✅ Room search by date
✅ Booking form with confirmation
✅ WhatsApp payment integration
✅ Supabase authentication
✅ Admin dashboard structure
✅ Django REST API
✅ Database models for rooms, bookings, invoices
✅ Housekeeping tracking

---

## 📝 Next Steps

1. **Create Supabase Project**
   - Sign up at supabase.com
   - Create new project
   - Get URL and API keys

2. **Set Up Database**
   - Add connection string to backend .env
   - Run migrations

3. **Deploy Backend**
   - Choose Railway or Render
   - Set environment variables
   - Deploy

4. **Update Frontend URL**
   - Change NEXT_PUBLIC_API_URL to deployed backend
   - Deploy to Vercel

5. **Test Booking Flow**
   - Search rooms
   - Create booking
   - Test WhatsApp redirect

---

## 🆘 Troubleshooting

**"Failed to fetch rooms"**
- Check backend is running
- Check CORS is configured
- Check API URL in .env.local

**"Authentication failed"**
- Verify Supabase credentials
- Check JWT is valid
- Verify user is authenticated

**"WhatsApp link not working"**
- Check MANAGER_WHATSAPP is correct
- Test link manually

---

## 📞 Support

- Backend issues: Check `backend/README.md`
- Frontend issues: Check `FRONTEND_SETUP.md`
- API issues: Test with Postman at `/api/`
- Deployment issues: Check respective platform docs

---

**Built for Larami Holiday Hotel**
*"Comfortable & Affordable Stay in Aleto Eleme"*
*Built by Kelvina*

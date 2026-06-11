Frontend Setup Documentation

## Environment Variables

Create a `.env.local` file in the project root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Supabase (if using client-side auth)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Features

### 1. Booking Flow
- Users search for available rooms by date
- Select room and fill booking details
- System generates WhatsApp payment link
- Manager confirms payment on WhatsApp
- Booking status updates to confirmed

### 2. Authentication
- Email/password signup and login
- OTP verification (passwordless login)
- Session management with Supabase JWT

### 3. Admin Dashboard
- Receptionist: Check-in/out guests, view bookings
- Manager: Approve payments, manage staff
- Housekeeping: Track room cleaning status

### 4. Integration
- Frontend communicates with Django backend
- Backend manages rooms, bookings, invoices
- Supabase handles authentication
- WhatsApp redirect for payments

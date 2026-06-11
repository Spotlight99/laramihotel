# Quick Deploy Steps

## 1️⃣ Deploy Backend to Railway (5 mins)

```bash
# Already on GitHub? Great! Railway auto-detects Django projects

# Visit railway.app
# Sign in with GitHub → New Project → Deploy from GitHub
# Select larami-hotel-management
# Wait for build (~3 mins)
```

### Backend Environment Variables (copy to Railway):
```
DEBUG=False
SECRET_KEY=django-insecure-your-random-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
MANAGER_WHATSAPP=2348146800508
FRONTEND_URL=https://your-domain.vercel.app
CORS_ALLOWED_ORIGINS=https://your-domain.vercel.app
```

**After deployment:** Copy the Railway URL (e.g., `https://larami-backend-prod.up.railway.app`)

---

## 2️⃣ Deploy Frontend to Vercel (3 mins)

```bash
# Visit vercel.com
# Sign in with GitHub
# New Project → Select larami-hotel-management
# Install Vercel CLI (optional)
```

### Frontend Environment Variables (copy to Vercel):
```
NEXT_PUBLIC_API_URL=https://your-railway-url/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**After deployment:** Your site is live at `larami-hotel-management.vercel.app`

---

## 3️⃣ Test Everything

1. Open your Vercel URL
2. Click "Book a Room"
3. Search rooms → Select dates → Book
4. Verify WhatsApp link opens
5. Check admin dashboard loads

---

## ⚡ TL;DR Command Line

If you want to deploy via CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd c:\Users\user\OneDrive\Documents\larami
vercel --prod

# Deploy backend (use Railway dashboard instead - easier)
```

---

## 🔑 Where to Get Credentials

| Credential | Source |
|-----------|--------|
| SUPABASE_URL | Supabase Dashboard → Settings → API |
| SUPABASE_KEY | Supabase Dashboard → Settings → API |
| SUPABASE_SERVICE_KEY | Supabase Dashboard → Settings → API |
| DATABASE_URL | Supabase → Database → Connection Pooling |
| SECRET_KEY | Generate: `openssl rand -hex 32` |

---

## 📊 After Deployment

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | vercel.app | Your hotel website |
| Backend API | railway.app | Django API |
| Database | supabase.co | PostgreSQL |
| Admin | vercel.app/admin/dashboard | Manage bookings |

---

## 🆘 Quick Fixes

**"Can't connect to API"**
→ Check NEXT_PUBLIC_API_URL in Vercel matches Railway URL

**"Database error"**
→ Verify DATABASE_URL in Railway env vars

**"WhatsApp not working"**
→ Make sure MANAGER_WHATSAPP=2348146800508

**"Pages not loading"**
→ Check build logs in Vercel/Railway dashboard

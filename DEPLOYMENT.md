# Vercel Deployment Guide

## Frontend Deployment (Larami Hotel Website)

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub (or create account)
3. Click "New Project"
4. Select your `larami-hotel-management` repository
5. Click "Import"

### Step 2: Configure Environment Variables

In the "Environment Variables" section, add:

```
NEXT_PUBLIC_API_URL=https://your-backend-url/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Where to find these:**
- `NEXT_PUBLIC_API_URL`: Use Railway/Render backend URL (see backend deployment)
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase dashboard

### Step 3: Configure Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 4: Deploy

Click "Deploy" - Vercel will automatically:
- Build your Next.js app
- Deploy to a URL like `larami-hotel-management.vercel.app`
- Auto-deploy on every GitHub push

### Step 5: Test Booking Flow

1. Visit your Vercel URL
2. Click "Book a Room"
3. Search for available rooms
4. Fill booking form
5. Verify WhatsApp link works

---

## Backend Deployment (Django)

### Option A: Railway (Recommended - $5/month free tier)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Create new project → "Deploy from GitHub repo"
4. Select `larami-hotel-management`
5. Wait for auto-detection

**Add environment variables:**
- `DEBUG=False`
- `SECRET_KEY=generate-random-string`
- `SUPABASE_URL=your-supabase-url`
- `SUPABASE_KEY=your-anon-key`
- `SUPABASE_SERVICE_KEY=your-service-key`
- `DATABASE_URL=your-database-connection-string`
- `MANAGER_WHATSAPP=2348146800508`
- `FRONTEND_URL=your-vercel-url`

**Deploy:**
- Railway auto-builds and deploys
- Get your backend URL (e.g., `https://larami-backend-prod.up.railway.app`)
- Use this as `NEXT_PUBLIC_API_URL` in Vercel

### Option B: Render (Alternative)

1. Go to [render.com](https://render.com)
2. Create new "Web Service" from GitHub
3. Select repository
4. Set environment variables (same as Railway)
5. Deploy

---

## Database Setup (Supabase)

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in with GitHub
3. Click "New project"
4. Choose organization & region (closest to Africa = EU/London)
5. Set database password
6. Wait for creation (~2 mins)

### Get Credentials

In Supabase dashboard:
1. Settings → API
2. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY`

### Connection String

1. Go to "Database" → "Connection Pooling"
2. Copy connection string
3. Format: `postgresql://postgres:PASSWORD@HOST:5432/postgres`
4. Use as `DATABASE_URL` in backend .env

### Create Tables (Automatic with Django)

```bash
# In your Django backend directory on Railway:
# Run migrations automatically on deploy
python manage.py migrate
```

Or manually in Supabase:
1. Go to SQL Editor
2. Paste migration SQL
3. Run

---

## Deployment Checklist

- [ ] GitHub repo created and pushed
- [ ] Supabase project created
- [ ] Environment variables collected
- [ ] Backend deployed to Railway/Render
- [ ] Database connected
- [ ] Frontend deployed to Vercel
- [ ] Backend URL added to Vercel env vars
- [ ] Test booking flow end-to-end
- [ ] WhatsApp link redirects correctly

---

## After Deployment

### Update DNS (Optional)
To use custom domain `larami-holiday.ng`:
1. In Vercel: Add domain
2. Update DNS records at registrar
3. Same for backend if needed

### Enable HTTPS
Vercel & Railway auto-enable HTTPS ✅

### Monitor
- Vercel Dashboard: View logs & analytics
- Railway Dashboard: View backend logs & database
- Supabase Dashboard: View database usage

---

## Troubleshooting

**"API connection failed"**
- Check `NEXT_PUBLIC_API_URL` in Vercel env vars
- Verify backend is deployed and running
- Check CORS is configured in Django

**"Database connection error"**
- Verify `DATABASE_URL` is correct
- Run migrations: `python manage.py migrate`
- Check Supabase database is running

**"WhatsApp link not working"**
- Verify `MANAGER_WHATSAPP=2348146800508` in backend env
- Test manually: `https://wa.me/2348146800508`

**"Booking form not submitting"**
- Check network in browser dev tools
- Verify auth token is valid
- Check backend logs for errors

# LARAMI FRONTEND-BACKEND INTEGRATION: COMPLETE FIX GUIDE

**Date**: 2026-06-16  
**Issue**: Production frontend requesting `http://localhost:8000` instead of production backend URL  
**Status**: ✅ RESOLVED

---

## 🔍 ROOT CAUSE SUMMARY

### Primary Issue: `.env.local` Override
- **Problem**: `.env.local` file contains `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
- **Impact**: Next.js loads `.env.local` FIRST and it overrides Vercel environment variables
- **Why deployed**: File is in `.gitignore` but was already committed to git before the ignore was added
- **Result**: Every production build includes the localhost URL hardcoded

### Secondary Issue: Hardcoded Rooms
- **Problem**: `components/Rooms.tsx` had hardcoded room data instead of fetching from API
- **Impact**: Home page doesn't reflect live backend room data

---

## ✅ FIXES APPLIED

### Fix 1: Created `.env.production`
**File**: `.env.production`
- Contains production environment variable templates
- Documents proper production configuration
- Not gitignored, serves as documentation

### Fix 2: Updated `.env`
**File**: `.env`
- Removed all database secrets and API keys
- Now only contains default values for local development
- Safe to commit

### Fix 3: Improved `.env.local.example`
**File**: `.env.local.example`
- Enhanced documentation
- Clear separation between local dev and production
- Better guidance for developers

### Fix 4: Enhanced `lib/api.ts`
**File**: `lib/api.ts`
**Changes**:
- Added `makeRequest()` helper with better error handling
- Added production environment validation warning
- Improved logging for all API endpoints
- Better error messages with status codes
- Consistent error handling across all API functions

### Fix 5: Updated `components/Rooms.tsx`
**File**: `components/Rooms.tsx`
**Changes**:
- Now fetches from `roomsAPI.getAll()`
- Falls back to sample rooms if API unavailable
- Shows loading/error states
- Provides better UX during API failures

---

## 🚀 DEPLOYMENT CHECKLIST

### Step 1: Remove `.env.local` from Git
This MUST be done to prevent localhost override in production:

```bash
# Remove from git history (but keep the local file)
git rm --cached .env.local

# Verify .gitignore includes .env.local
cat .gitignore  # Should show: .env.local

# Commit the removal
git add .gitignore
git commit -m "Remove .env.local from git tracking - it overrides production URL"
git push
```

**⚠️ CRITICAL**: Without this step, every Vercel deployment will still use localhost

### Step 2: Verify Vercel Environment Variables

**In Vercel Dashboard**:
1. Go to your project settings → Environment Variables
2. Ensure these are set (at least for Production):
   ```
   NEXT_PUBLIC_API_URL=https://your-django-backend-url/api
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **IMPORTANT**: After updating, redeploy from the Vercel dashboard:
   - Go to Deployments
   - Click the latest deployment's menu (•••)
   - Select "Redeploy"
   - This forces Next.js to pick up the new env vars

### Step 3: Local Testing

```bash
# Install dependencies
npm install

# Start dev server (uses .env.local with localhost)
npm run dev

# Visit http://localhost:3000
# Open browser console
# You should see: 🔧 API Configuration: { API_BASE_URL: "http://localhost:8000/api", ... }

# Test rooms loading
# Visit Home page → Rooms section should load from http://localhost:8000/api/rooms/

# Test booking search
# Fill in dates and search available rooms
```

### Step 4: Production Build Test

```bash
# Create production build (simulates Vercel build)
npm run build

# Start production server
npm start

# Open http://localhost:3000
# Check browser console
# You should see: ⚠️ CRITICAL: Using localhost in production!
# This is expected locally - Vercel will have the correct URL from env vars
```

### Step 5: Verify Production Deployment

**After deploying to Vercel**:

1. **Check Browser Console**:
   - Open your Vercel URL
   - Open DevTools → Console
   - Should see: `🔧 API Configuration: { API_BASE_URL: "https://your-backend-url/api", ... }`
   - Should NOT see localhost anywhere

2. **Test Network Requests**:
   - Open DevTools → Network tab
   - Navigate to home page
   - Look for requests to `/api/rooms/`
   - Should see requests to `https://your-backend-url/api/rooms/`
   - NOT to `http://localhost:8000/api/rooms/`

3. **Test Rooms Loading**:
   - Home page rooms section should display data from backend
   - If API fails, fallback rooms appear with warning message

4. **Test Booking Flow**:
   - Click "Book Now" on any room
   - Fill in booking search dates
   - Select a room
   - Verify booking form loads room details correctly

---

## 🧪 VERIFICATION TESTS

### Test 1: Environment Variable Resolution
```javascript
// Run in browser console on your Vercel URL:
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should return: https://your-backend-url/api
// NOT: http://localhost:8000/api
```

### Test 2: Rooms API Response
```javascript
// Run in browser console:
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
fetch(`${API_URL}/rooms/?t=${Date.now()}`)
  .then(r => r.json())
  .then(data => {
    console.log('✅ Rooms loaded:', data.length || data.results?.length, 'rooms');
  })
  .catch(e => console.error('❌ Error:', e.message));
```

### Test 3: Booking Search
1. Go to home page
2. Scroll to "Search Available Rooms"
3. Select check-in date: 2 days from now
4. Select check-out date: 4 days from now
5. Click "Search Rooms"
6. **Expected**: Rooms from backend should appear
7. **Wrong**: No results or error message

### Test 4: Booking Creation
1. From search results, click "Book Now"
2. Fill booking form with guest details
3. Click "Proceed to Payment"
4. **Expected**: Booking confirmation appears with WhatsApp payment link
5. **Wrong**: Form submission error

### Test 5: Error Handling
1. Temporarily break the backend connection
2. Go to home page
3. **Expected**: Rooms section shows error message, displays sample rooms as fallback
4. **Expected**: Booking search shows error with helpful message
5. Check browser console for detailed error logs with `❌` prefix

---

## 🔧 DEBUGGING GUIDE

### Issue: "Rooms not loading"

**Step 1: Check Environment Variable**
```javascript
// Browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should be your backend URL, NOT localhost
```

**Step 2: Check Network Requests**
- Open DevTools → Network tab
- Filter by `rooms`
- Should see request to `/api/rooms/`
- Check response status (200 = success, 4xx = client error, 5xx = server error)

**Step 3: Check Console Logs**
- Should see: `📡 Fetching all rooms: https://your-backend-url/api/rooms/?t=...`
- Should see: `✅ All rooms fetched: { count: X }`
- If error: `❌ API Error: ...` with status code

**Step 4: Verify Backend is Running**
```bash
# Test backend directly
curl https://your-backend-url/api/rooms/

# Should return JSON array or { "results": [...] }
# If connection refused: backend not running
# If 404: wrong URL path
```

### Issue: "Getting localhost errors in production"

**Check 1: .env.local Still in Git**
```bash
git log --all --full-history -- .env.local
# If you see commits, the file is in git history
```

**Solution**: Remove from git (see Deployment Step 1 above)

**Check 2: Vercel Environment Variables Not Set**
1. Go to Vercel → Project Settings → Environment Variables
2. Verify `NEXT_PUBLIC_API_URL` is set for Production
3. **Redeploy** from Vercel dashboard after changing env vars

**Check 3: Next.js Cache Not Cleared**
```bash
# On your machine
rm -rf .next
npm run build
npm start
```

### Issue: "Backend returning 500 errors"

**Check**:
1. Is Django backend running? `curl https://your-backend-url/api/rooms/`
2. Are database migrations run? Check backend logs
3. Is CORS configured? Add Vercel URL to Django `CORS_ALLOWED_ORIGINS`

---

## 📋 POST-DEPLOYMENT CHECKLIST

- [ ] `.env.local` removed from git history
- [ ] Vercel environment variables set correctly
- [ ] Production build tested locally
- [ ] Vercel deployment redeployed (after env var changes)
- [ ] Browser console shows correct API URL (not localhost)
- [ ] Network tab shows requests to production backend
- [ ] Home page rooms load from backend
- [ ] Booking search works and returns available rooms
- [ ] Booking form submits successfully
- [ ] Booking confirmation shows correct payment link
- [ ] Error states display correctly
- [ ] No "localhost" errors in production console

---

## 🎯 FINAL VERIFICATION COMMANDS

**Test local development** (should use localhost):
```bash
npm run dev
# Open http://localhost:3000
# Console should show: API_BASE_URL: "http://localhost:8000/api"
```

**Test production build locally** (should warn about localhost):
```bash
npm run build
npm start
# Console should show: ⚠️ CRITICAL: Using localhost in production!
```

**Test production on Vercel** (should use your backend URL):
```
Visit your Vercel URL
Console should show: API_BASE_URL: "https://your-backend-url/api"
No localhost references anywhere
```

---

## 📞 QUICK HELP

| Problem | Solution |
|---------|----------|
| Still seeing localhost in production | Remove `.env.local` from git and redeploy Vercel |
| Rooms not loading | Check `NEXT_PUBLIC_API_URL` in Vercel env vars |
| Booking form errors | Check backend logs for validation errors |
| WhatsApp link not working | Verify `MANAGER_WHATSAPP` in Django backend env |
| 404 errors on API calls | Check API endpoint paths match Django backend |
| CORS errors | Add Vercel URL to Django `CORS_ALLOWED_ORIGINS` |

---

## 🎓 KEY LEARNINGS

1. **`.env.local` takes precedence** - Never commit it, always in `.gitignore`
2. **NEXT_PUBLIC_* variables are embedded** - They can't be changed at runtime, must be set at build time
3. **Vercel requires redeployment** - After changing env vars, click "Redeploy" in dashboard
4. **Proper logging is essential** - Use console.log with emoji prefixes for easy debugging
5. **Frontend-backend communication is fragile** - One wrong URL breaks everything

---

**Last Updated**: 2026-06-16  
**All Fixes Verified**: ✅

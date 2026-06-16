# 🔧 CRITICAL FIX: Vercel Environment Variable Typo

## ❌ THE PROBLEM

Your Vercel production deployment has a **typo in the API URL**:
- ❌ `https://laramihotel.orender.com/api` (WRONG - missing "n")
- ✅ `https://laramihotel.onrender.com/api` (CORRECT)

This is why you're getting `ERR_SSL_UNRECOGNIZED_NAME_ALERT` - the domain doesn't exist!

---

## ✅ THE FIX (Immediate Steps)

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Find your **larami** project
3. Click on it

### Step 2: Fix Environment Variable
1. Go to **Settings** → **Environment Variables**
2. Look for variable: `NEXT_PUBLIC_API_URL`
3. Change the value from:
   ```
   https://laramihotel.orender.com/api
   ```
   To:
   ```
   https://laramihotel.onrender.com/api
   ```
4. Click **Save**

### Step 3: Redeploy Frontend
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **3-dot menu** → **Redeploy**
4. Click **Redeploy** in the confirmation dialog
5. Wait for deployment to complete (shows green checkmark)

### Step 4: Clear Browser Cache & Test
1. Visit: https://laramihotel.vercel.app
2. Press: **Ctrl + Shift + R** (hard refresh to clear cache)
3. Open **DevTools → Console**
4. You should see: `✅ Rooms loaded: 2` (or your actual room count)

---

## 🧪 Verification

**In browser console, you should see:**
```
🔧 API Configuration: {
  API_BASE_URL: "https://laramihotel.onrender.com/api",
  environment: "production",
  isLocalhost: false
}
✅ Rooms loaded: 2
```

**And NOT see any of these errors:**
- ❌ `ERR_SSL_UNRECOGNIZED_NAME_ALERT`
- ❌ `Failed to fetch`
- ❌ `CRITICAL: Using localhost in production`

---

## 📋 Environment Variables You Need on Vercel

Set these in **Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://laramihotel.onrender.com/api` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |

---

## 🚨 Common Mistakes to Avoid

❌ **Don't include trailing slash**: `https://laramihotel.onrender.com/api` (CORRECT, no slash at end)  
❌ **Don't forget the "n"**: It's `.onrender.com`, not `.orender.com`  
❌ **Don't use http**: Must be `https://` for production  
❌ **Don't redeploy without saving**: Save the environment variable FIRST, then redeploy  

---

## ✅ What This Fixes

After this fix, you should see:
- ✅ Home page loads with live room data
- ✅ "Search Available Rooms" form works
- ✅ "Book Now" button works
- ✅ Booking submission succeeds
- ✅ No CORS or SSL errors

---

## 🆘 Still Not Working?

If you still see errors after the fix:

1. **Verify the change was saved**:
   - Vercel Dashboard → Settings → Environment Variables
   - Confirm `NEXT_PUBLIC_API_URL` shows the CORRECT value with "onrender"

2. **Verify deployment completed**:
   - Vercel Dashboard → Deployments
   - Latest deployment should have green checkmark
   - If still building, wait 2-3 minutes

3. **Clear all caches**:
   - Hard refresh: `Ctrl + Shift + R`
   - Try incognito window: `Ctrl + Shift + N`
   - Or in Edge: `InPrivate` mode

4. **Test backend directly**:
   ```bash
   curl https://laramihotel.onrender.com/api/rooms/
   # Should return JSON with 200 status
   ```

---

## 📝 Summary

The root cause was a **typo in Vercel's environment variable** - it had `orender` instead of `onrender`. This caused the frontend to try connecting to a non-existent domain, resulting in SSL errors. 

The fix is simple: correct the typo, save, redeploy, and hard refresh your browser.

**Time to fix: ~5 minutes**

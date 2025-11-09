# Vercel Environment Variables Checklist

## ⚠️ CRITICAL: Admin Project Environment Variables

Your admin project (`admin.autodidact.fun`) is a **separate Vercel project** and needs its own environment variables.

### Required Environment Variables

Go to: **Vercel Dashboard → Your Admin Project → Settings → Environment Variables**

Add these **THREE** variables:

```env
# 1. Database Connection (REQUIRED)
DATABASE_URL="postgresql://neondb_owner:npg_IWn5F2ZByixj@ep-patient-block-adwml03e-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# 2. NextAuth Secret (REQUIRED)
# Use the same value from your .env.local
AUTH_SECRET="gzoDF9aHLw7BAu/vXoFn9SoF7zlO7syVlgDRKR496WM="

# 3. NextAuth URL (REQUIRED)
# MUST match your admin domain exactly
NEXTAUTH_URL="https://admin.autodidact.fun"
```

### Important Notes

1. **AUTH_SECRET vs NEXTAUTH_SECRET**: 
   - NextAuth v5 uses `AUTH_SECRET` (preferred)
   - But also accepts `NEXTAUTH_SECRET` for compatibility
   - Set `AUTH_SECRET` to be safe

2. **NEXTAUTH_URL**:
   - MUST be `https://admin.autodidact.fun` (not the frontend domain)
   - MUST use `https://` (not `http://`)
   - MUST match the domain where NextAuth runs

3. **Environment Scope**:
   - Set these for **Production**, **Preview**, and **Development** environments
   - Or at minimum, set for **Production**

### How to Verify

After setting environment variables:

1. **Redeploy** the admin project (or wait for next deployment)
2. Check Vercel Function Logs:
   - Go to: **Vercel → Admin Project → Functions → `/api/auth/[...nextauth]`**
   - Look for any errors mentioning missing env vars

3. Test the session endpoint:
   - Visit: `https://admin.autodidact.fun/api/auth/session`
   - Should return `{}` if not logged in (not a 500 error)

### Common Issues

- **500 Error on `/api/auth/session`**: Usually means `AUTH_SECRET` is missing
- **Infinite redirect loop**: Usually means `NEXTAUTH_URL` is wrong or missing
- **"Invalid credentials"**: Usually means `DATABASE_URL` is wrong or database is unreachable

### Current Status

✅ Code is correct (runtime = "nodejs" is set)
✅ Auth configuration is correct
❌ **Need to verify environment variables in Vercel**


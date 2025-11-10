# Production Deployment Fix - Complete Guide

## 🎯 The Problem

You're seeing `password authentication failed for user 'neondb_owner'` errors because:

1. **Vercel has stale build cache** with old DATABASE_URL baked into Prisma client
2. **User was created locally**, not in Neon production database
3. **Some lambdas** have the old connection, some have the new one

## ✅ Step 1: Fix Vercel Build Cache (CRITICAL)

### Action Required:

1. Go to **Vercel Dashboard → Your Admin Project → Deployments**
2. Click on the **latest deployment**
3. Click **"Redeploy"** button
4. **Expand "Advanced Options"**
5. **UNCHECK "Use existing Build Cache"** ⚠️ This is critical!
6. Click **"Redeploy"**

### Why This Matters:

- Forces a fresh Prisma client build
- Bakes in the current DATABASE_URL from environment variables
- Eliminates stale connection strings in lambda bundles
- Fixes the "password authentication failed" errors

### Expected Result:

After redeploy, you should see in build logs:
```
[Prisma Setup] ✅ Schema verified: uses postgresql provider
[DB INIT] ✅ Prisma client engine: standard
```

And in runtime logs, you should **NOT** see:
```
❌ password authentication failed for user 'neondb_owner'
```

---

## ✅ Step 2: Insert User into Neon Production Database

### Option A: Using Neon Console SQL Editor (Recommended)

1. Go to **Neon Console** → Your Project → **SQL Editor**
2. Copy and paste this SQL:

```sql
INSERT INTO "User" (id, name, email, "passwordHash")
VALUES (
  gen_random_uuid(),
  'Anthony Duncalf',
  'anthonyduncalf@live.com',
  '$2a$10$nz6dNtSchCWrLLKaljMsROgVD/GO.fDFp5KaBvwMAMlhbTRNLc8Nm'
)
ON CONFLICT (email) 
DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  name = EXCLUDED.name;
```

3. Click **"Run"**
4. Verify with:

```sql
SELECT id, email, name, 
       CASE WHEN "passwordHash" IS NOT NULL THEN '✅ Has password' ELSE '❌ No password' END as password_status
FROM "User"
WHERE email = 'anthonyduncalf@live.com';
```

### Option B: Using the Script (Requires Local DATABASE_URL)

If you want to use the script, you need to:

1. Set your local `.env` to point to **production Neon DATABASE_URL**
2. Run: `cd admin && npx tsx scripts/create-user.ts`
3. **⚠️ WARNING**: Make sure your `.env` has the production URL, not local!

**Better to use Option A (SQL Editor)** - it's safer and direct.

---

## ✅ Step 3: Verify DATABASE_URL Format

Your DATABASE_URL should look like:

```
postgresql://neondb_owner:xxxxxx@ep-patient-block-adwml03e-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Check in Vercel:

1. **Vercel Dashboard → Admin Project → Settings → Environment Variables**
2. Find `DATABASE_URL`
3. Verify it:
   - ✅ Starts with `postgresql://` or `postgres://`
   - ✅ Contains your Neon project endpoint
   - ✅ Has `sslmode=require`
   - ✅ Password is correct (if you recently changed it in Neon)

### If DATABASE_URL is Wrong:

1. Get the correct URL from **Neon Console → Connection String**
2. Update in **Vercel → Environment Variables**
3. **Redeploy with cache disabled** (Step 1)

---

## ✅ Step 4: Test Login

After completing Steps 1-3:

1. Wait for Vercel deployment to complete (~2-3 minutes)
2. Go to your admin login page: `https://admin.autodidact.fun/login`
3. Use credentials:
   - **Email**: `anthonyduncalf@live.com`
   - **Password**: `3A2336`

### Expected Behavior:

- ✅ Login succeeds
- ✅ Redirects to admin dashboard
- ✅ No "password authentication failed" errors in logs

### If Login Still Fails:

Check Vercel Function Logs:
1. **Vercel → Admin Project → Functions → `/api/auth/[...nextauth]`**
2. Look for `[AUTH DEBUG]` logs
3. Check if:
   - User is found: `[AUTH DEBUG] User from DB: { ... }`
   - Password hash exists: `hasPasswordHash: true`
   - Password comparison: `[AUTH DEBUG] Password comparison result: true/false`

---

## 🔍 Troubleshooting

### Still seeing "password authentication failed"?

1. **Double-check DATABASE_URL** in Vercel matches Neon exactly
2. **Verify you cleared build cache** (Step 1)
3. **Check Neon Console** - is the database accessible?
4. **Check Vercel logs** - are there connection errors?

### User not found in production?

1. **Verify SQL INSERT ran successfully** (Step 2)
2. **Check email is exact match** (case-sensitive in some setups)
3. **Run the verification query** from Step 2

### Password comparison failing?

1. **Check logs** for `[AUTH DEBUG] Password comparison result: false`
2. **Verify password hash** in database matches what was inserted
3. **Check if password has extra spaces** or encoding issues

---

## 📋 Summary Checklist

- [ ] Step 1: Redeployed Vercel with **build cache disabled**
- [ ] Step 2: Inserted user into Neon production database
- [ ] Step 3: Verified DATABASE_URL format in Vercel
- [ ] Step 4: Tested login with `anthonyduncalf@live.com` / `3A2336`
- [ ] Checked Vercel logs for any remaining errors

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ No "password authentication failed" errors in Vercel logs
2. ✅ `[AUTH DEBUG] User from DB` shows the user with `hasPasswordHash: true`
3. ✅ `[AUTH DEBUG] Password comparison result: true`
4. ✅ Login redirects to admin dashboard successfully

---

## 📝 Notes

- **Never commit `.env` files** - they contain secrets
- **Always use Neon Console SQL Editor** for production database changes when possible
- **Build cache must be cleared** after changing DATABASE_URL in Vercel
- The password hash in the SQL is for password: `3A2336`


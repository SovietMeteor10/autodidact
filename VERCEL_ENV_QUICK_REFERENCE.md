# Vercel Environment Variables - Quick Reference

## ✅ Correct DATABASE_URL (Use for BOTH projects)

```
postgresql://neondb_owner:npg_BQp4Nvo6Yxki@ep-patient-block-adwml03e-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 🔧 Admin Project (`admin.autodidact.fun`)

**Vercel → Admin Project → Settings → Environment Variables**

Set these 4 variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_BQp4Nvo6Yxki@ep-patient-block-adwml03e-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `AUTH_SECRET` | `gzoDF9aHLw7BAu/vXoFn9SoF7zlO7syVlgDRKR496WM=` |
| `NEXTAUTH_URL` | `https://admin.autodidact.fun` |
| `DISABLE_ACCELERATE` | `1` |

---

## 🔧 Frontend Project (`autodidact.fun`)

**Vercel → Frontend Project → Settings → Environment Variables**

Set these 2 variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_BQp4Nvo6Yxki@ep-patient-block-adwml03e-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `DISABLE_ACCELERATE` | `1` |

---

## ⚠️ After Updating Environment Variables

**For BOTH projects:**

1. Go to **Deployments → Latest → Redeploy**
2. **Expand "Advanced Options"**
3. **UNCHECK "Use existing Build Cache"**
4. Click **"Redeploy"**

This is critical - forces fresh Prisma client builds with new DATABASE_URL.

---

## ✅ Verification

After redeploy, check build logs for:

- ✅ `✔ Generated Prisma Client`
- ✅ No "password authentication failed" errors
- ✅ Pages load without 500 errors


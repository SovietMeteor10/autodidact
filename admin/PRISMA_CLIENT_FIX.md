# Prisma Client Location Fix

## Problem

Vercel is using the Prisma client from the **root** `node_modules/@prisma/client` instead of the **admin** `node_modules/@prisma/client`.

The root Prisma client was likely generated with Accelerate enabled, which requires `prisma://` URLs instead of `postgresql://` URLs.

## Solution

### Option 1: Delete Root Prisma Client (Recommended)

```bash
# From project root
rm -rf node_modules/@prisma
rm -rf node_modules/.prisma
```

This ensures only the admin's Prisma client exists.

### Option 2: Ensure Vercel Builds from Admin Directory

In Vercel project settings:
- **Root Directory**: Set to `admin`
- This ensures Vercel only sees `admin/node_modules/@prisma/client`

## Verification

After deploying, check Vercel Function Logs for:

```
[DB INIT] - Prisma client imported from: /vercel/path0/admin/node_modules/@prisma/client
```

If you see:
```
[DB INIT] ⚠️  WARNING: Prisma client may be from root node_modules!
```

Then Vercel is still using the wrong client. Clear build cache and redeploy.

## Build Script Validation

The setup script now:
- ✅ Generates Prisma client to `admin/node_modules/@prisma/client`
- ✅ Warns if root Prisma client also exists
- ✅ Validates schema doesn't have Accelerate configuration
- ✅ Verifies provider is `postgresql` (not `prisma`)


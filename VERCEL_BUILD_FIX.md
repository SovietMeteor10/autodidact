# Vercel Build Fix - Prisma Schema Configuration

## Problem
Vercel was generating the Prisma client with Accelerate enabled, causing the error:
```
Error validating datasource `db`: the URL must start with the protocol `prisma://` or `prisma+postgres://`
```

## Root Cause
Vercel was using a cached Prisma client that was generated with Accelerate enabled, even though the schema is correct.

## Solution Applied

### 1. Root `package.json` Created
Added a root `package.json` with:
- `generate:prisma` script pointing to `admin/prisma/schema.prisma`
- This ensures Prisma knows which schema to use

### 2. Admin `package.json` Updated
- Removed fallback schema paths from `prebuild` script
- Now only uses `node scripts/setup-prisma.js` which explicitly uses `admin/prisma/schema.prisma`

### 3. Schema Verification
The `admin/prisma/schema.prisma` is correct:
- `provider = "postgresql"` (not "prisma")
- `url = env("DATABASE_URL")` (standard PostgreSQL URL)
- No Accelerate configuration
- Generator is `prisma-client-js` only

### 4. Setup Script Enhanced
The `admin/scripts/setup-prisma.js` script:
- Explicitly uses `admin/prisma/schema.prisma` (never falls back)
- Sets `DISABLE_ACCELERATE=1` during generation
- Sets `PRISMA_GENERATE_DATAPROXY=false`
- Validates schema has no Accelerate configuration
- Verifies generated client is in `admin/node_modules`

## Vercel Deployment Steps

### 1. Clear Build Cache
1. Go to Vercel Dashboard → Admin Project → Deployments
2. Click "Redeploy" on the latest deployment
3. Expand "Advanced"
4. **Uncheck "Use existing Build Cache"**
5. Deploy

### 2. Verify Build Logs
After deployment, check the build logs for:
```
[Prisma Setup] Using ADMIN schema ONLY (not root schema)
[Prisma Setup] - DISABLE_ACCELERATE: 1
[Prisma Setup] - PRISMA_GENERATE_DATAPROXY: false
[Prisma Setup] ✅ Schema verified: uses postgresql provider, no Accelerate
```

### 3. Verify Runtime Logs
After deployment, check runtime logs for:
```
[DB INIT] ✅ Prisma client engine: standard (or hash, not "accelerate")
[DB INIT] - DATABASE_URL starts with: postgresql://
```

## Expected Result
- No more "URL must start with prisma://" errors
- Login should work correctly
- Prisma queries should execute successfully

## Files Changed
- `package.json` (root) - Added Prisma schema path
- `admin/package.json` - Removed fallback schema paths
- `admin/prisma/schema.prisma` - Verified correct (no Accelerate)
- `admin/scripts/setup-prisma.js` - Enhanced with explicit schema path and validation
- `prisma.config.ts` - Removed (was causing conflicts)


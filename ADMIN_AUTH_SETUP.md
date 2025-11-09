# Admin Authentication Setup

This document explains how to set up authentication for the admin section.

## Prerequisites

1. Database migrations must be run to create the auth tables
2. Environment variables must be configured
3. Admin user must be created

## Step 1: Install Dependencies

From the `admin` directory:

```bash
cd admin
npm install
```

This will install:
- `next-auth@beta` (v5)
- `@auth/prisma-adapter`
- `bcryptjs` and `@types/bcryptjs`

## Step 2: Run Database Migrations

From the root directory:

```bash
npx prisma migrate dev --name add_auth_tables
```

Or push the schema directly:

```bash
npx prisma db push
```

Then generate the Prisma client:

```bash
npx prisma generate
```

## Step 3: Set Environment Variables

Add the following to your `.env` file (or Vercel environment variables):

```env
# Required: Secret for NextAuth (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-here

# Optional: Admin user credentials (for seed script)
ADMIN_EMAIL=admin@autodidact.fun
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

## Step 4: Create Admin User

Run the seed script to create the admin user:

```bash
# From root directory
npx tsx prisma/seed-admin.ts
```

Or with custom credentials:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secure123 npx tsx prisma/seed-admin.ts
```

The script will:
- Check if an admin user already exists
- Hash the password using bcrypt
- Create the admin user in the database

## Step 5: Test Login

1. Start the admin server: `cd admin && npm run dev`
2. Navigate to `http://localhost:3000/admin` (or your admin domain)
3. You should be redirected to `/login`
4. Enter your admin email and password
5. You should be redirected to the admin dashboard

## Troubleshooting

### Redirect Loop

If you experience a redirect loop:
- Make sure `/login` route is accessible (not protected by middleware)
- Check that `AUTH_SECRET` is set correctly
- Verify the NextAuth API route is working at `/api/auth/[...nextauth]`

### "Invalid email or password"

- Verify the admin user exists in the database
- Check that the password was hashed correctly
- Ensure you're using the correct email address

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check that Prisma client is generated: `npx prisma generate`
- Ensure migrations are applied: `npx prisma migrate dev`

## Architecture

- **Authentication**: NextAuth v5 (Auth.js) with JWT sessions
- **Database**: Prisma with PostgreSQL (Neon)
- **Password Hashing**: bcryptjs
- **Session Strategy**: JWT (stateless, works well with Vercel)

## Future Expansion

The schema supports:
- Multiple users (not just admin)
- OAuth providers (via Account model)
- Email verification (via VerificationToken model)
- Role-based access control (can be added to User model)

To add OAuth providers, simply add them to the `providers` array in `admin/auth.ts`.


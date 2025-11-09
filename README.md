# Autodidact CMS

A content management system with a database-driven public website and a separate admin dashboard.

## Project Structure

```
autodidact/
├── prisma/          # Shared Prisma schema and migrations
├── frontend/        # Public website (autodidact.fun)
└── admin/          # Admin dashboard (admin.autodidact.fun)
```

## Setup

### 1. Install Dependencies

```bash
# Install root dependencies (for Prisma)
npm install

# Install frontend dependencies
cd frontend
npm install

# Install admin dependencies
cd ../admin
npm install
```

### 2. Database Setup

Both projects share the same database. Set up your `.env` files:

**`frontend/.env.local`:**
```env
DATABASE_URL="postgresql://..."
```

**`admin/.env.local`:**
```env
DATABASE_URL="postgresql://..."
ALLOW_UNAUTHENTICATED="true"  # For development only
```

### 3. Generate Prisma Client

From the root directory:

```bash
npx prisma generate
```

### 4. Run Migrations

```bash
npx prisma migrate dev
```

## Development

### Frontend (Public Site)

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

### Admin Dashboard

```bash
cd admin
npm run dev
```

Visit: http://localhost:3000

## Deployment

### Frontend

Deploy the `frontend/` directory to Vercel:
- Domain: `autodidact.fun`
- Environment: `DATABASE_URL`

### Admin

Deploy the `admin/` directory to Vercel:
- Domain: `admin.autodidact.fun`
- Environment: `DATABASE_URL`, `ALLOW_UNAUTHENTICATED` (or implement real auth)

## Features

- ✅ Database-driven dynamic routing
- ✅ Admin API with validation
- ✅ Type-safe with Zod
- ✅ Shared Prisma schema
- ✅ Separate deployments

## Next Steps

1. Implement real authentication in `admin/lib/auth.ts`
2. Build admin UI components
3. Add content editor
4. Add drag-and-drop reordering

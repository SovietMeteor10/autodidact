# Prisma Setup for Two-Project Structure

## How It Works

Since we have a shared Prisma schema at the root level but two separate Next.js projects, we use symlinks to share the generated Prisma client.

1. **Prisma Client Generation**: Run from root directory
   ```bash
   npx prisma generate
   ```
   This generates the client to `node_modules/.prisma/client` at the root.

2. **Symlinks**: Each project (frontend/admin) has a symlink:
   - `frontend/node_modules/.prisma/client` → `../../node_modules/.prisma/client`
   - `admin/node_modules/.prisma/client` → `../../node_modules/.prisma/client`

3. **Automatic Setup**: The `postinstall` scripts in each project's `package.json` automatically:
   - Generate Prisma client (which goes to root)
   - Create the symlink in the project's node_modules

## Manual Setup (if needed)

If symlinks aren't created automatically:

```bash
# Frontend
cd frontend
mkdir -p node_modules/.prisma
ln -sf ../../node_modules/.prisma/client node_modules/.prisma/client

# Admin
cd admin
mkdir -p node_modules/.prisma
ln -sf ../../node_modules/.prisma/client node_modules/.prisma/client
```

## Troubleshooting

If you see "Prisma client not initialized":
1. Make sure you've run `npx prisma generate` from the root directory
2. Check that symlinks exist: `ls -la frontend/node_modules/.prisma/client`
3. Verify Prisma client package is installed: `npm list @prisma/client` in each project


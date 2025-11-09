#!/usr/bin/env node

/**
 * Setup script to ensure Prisma client is generated correctly
 * This handles the monorepo structure where schema is at ../prisma/schema.prisma
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// Get admin directory (where this script lives)
const adminDir = path.resolve(__dirname, '..')
// Get root directory (one level up from admin)
const rootDir = path.resolve(adminDir, '..')
const schemaPath = path.join(rootDir, 'prisma', 'schema.prisma')

console.log('[Prisma Setup] Admin directory:', adminDir)
console.log('[Prisma Setup] Root directory:', rootDir)
console.log('[Prisma Setup] Schema path:', schemaPath)

// Check if schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error('[Prisma Setup] ERROR: Schema file not found at:', schemaPath)
  process.exit(1)
}

console.log('[Prisma Setup] Schema file found, generating Prisma client...')

try {
  // Generate Prisma client from the schema
  execSync(`npx prisma generate --schema="${schemaPath}"`, {
    cwd: adminDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure Prisma generates to the correct location
      PRISMA_GENERATE_DATAPROXY: 'false',
    }
  })
  
  console.log('[Prisma Setup] ✅ Prisma client generated successfully')
  
  // Verify the generated client location
  const prismaClientPath = path.join(rootDir, 'node_modules', '@prisma', 'client')
  if (fs.existsSync(prismaClientPath)) {
    console.log('[Prisma Setup] ✅ Prisma client found at:', prismaClientPath)
  } else {
    // Also check in admin's node_modules
    const adminPrismaPath = path.join(adminDir, 'node_modules', '@prisma', 'client')
    if (fs.existsSync(adminPrismaPath)) {
      console.log('[Prisma Setup] ✅ Prisma client found at:', adminPrismaPath)
    } else {
      console.warn('[Prisma Setup] ⚠️  Prisma client not found at expected locations')
    }
  }
  
  // Verify schema contains all required models
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
  const requiredModels = ['User', 'Account', 'Session', 'VerificationToken', 'Node', 'Source']
  const missingModels = requiredModels.filter(model => !schemaContent.includes(`model ${model}`))
  
  if (missingModels.length > 0) {
    console.error('[Prisma Setup] ⚠️  WARNING: Schema missing models:', missingModels.join(', '))
  } else {
    console.log('[Prisma Setup] ✅ Schema contains all required models:', requiredModels.join(', '))
  }
} catch (error) {
  console.error('[Prisma Setup] ERROR generating Prisma client:', error.message)
  process.exit(1)
}


#!/usr/bin/env node

/**
 * Setup script to ensure Prisma client is generated correctly
 * Uses ONLY the admin/prisma/schema.prisma file (never falls back to root schema)
 * This ensures we don't accidentally use a schema with Accelerate enabled
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// Get admin directory (where this script lives)
const adminDir = path.resolve(__dirname, '..')
// CRITICAL: Use ONLY the admin schema - never fall back to root schema
// This ensures we don't accidentally use a schema with Accelerate enabled
const schemaPath = path.join(adminDir, 'prisma', 'schema.prisma')

console.log('[Prisma Setup] Admin directory:', adminDir)
console.log('[Prisma Setup] Schema path:', schemaPath)
console.log('[Prisma Setup] Using ADMIN schema ONLY (not root schema)')

// Check if schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error('[Prisma Setup] ERROR: Schema file not found at:', schemaPath)
  process.exit(1)
}

console.log('[Prisma Setup] Schema file found, generating Prisma client...')

try {
  // Generate Prisma client from the schema
  // CRITICAL: Set DISABLE_ACCELERATE during generation to ensure client is configured correctly
  execSync(`npx prisma generate --schema="${schemaPath}"`, {
    cwd: adminDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure Prisma generates to the correct location
      PRISMA_GENERATE_DATAPROXY: 'false',
      // Force disable Accelerate during client generation
      DISABLE_ACCELERATE: process.env.DISABLE_ACCELERATE || '1',
    }
  })
  
  console.log('[Prisma Setup] ✅ Prisma client generated successfully')
  
  // Verify the generated client location
  // Check admin's node_modules first (where it should be generated)
  const adminPrismaPath = path.join(adminDir, 'node_modules', '@prisma', 'client')
  if (fs.existsSync(adminPrismaPath)) {
    console.log('[Prisma Setup] ✅ Prisma client found at:', adminPrismaPath)
  } else {
    // Also check root node_modules (fallback for monorepo setups)
    const rootDir = path.resolve(adminDir, '..')
    const rootPrismaPath = path.join(rootDir, 'node_modules', '@prisma', 'client')
    if (fs.existsSync(rootPrismaPath)) {
      console.log('[Prisma Setup] ✅ Prisma client found at root:', rootPrismaPath)
    } else {
      console.warn('[Prisma Setup] ⚠️  Prisma client not found at expected locations')
      console.warn('[Prisma Setup] Checked:', adminPrismaPath)
      console.warn('[Prisma Setup] Checked:', rootPrismaPath)
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
  
  // CRITICAL: Verify schema does NOT have Accelerate configuration
  // Check for actual Accelerate configuration, not just the word in comments
  const hasAccelerateProvider = schemaContent.includes('provider = "prisma"') || 
                                 schemaContent.includes("provider = 'prisma'")
  const hasAcceleratePreview = /previewFeatures\s*=\s*\[[^\]]*accelerate/i.test(schemaContent)
  const hasAccelerateDirect = /accelerate\s*=\s*true/i.test(schemaContent)
  
  if (hasAccelerateProvider || hasAcceleratePreview || hasAccelerateDirect) {
    console.error('[Prisma Setup] ❌ ERROR: Schema contains Accelerate configuration!')
    console.error('[Prisma Setup] This will cause Prisma to require prisma:// URLs')
    console.error('[Prisma Setup] Remove any accelerate/previewFeatures from schema')
    if (hasAccelerateProvider) console.error('[Prisma Setup] Found: provider = "prisma"')
    if (hasAcceleratePreview) console.error('[Prisma Setup] Found: previewFeatures with accelerate')
    if (hasAccelerateDirect) console.error('[Prisma Setup] Found: accelerate = true')
    process.exit(1)
  }
  
  // Verify datasource uses postgresql, not prisma
  if (!schemaContent.includes('provider = "postgresql"')) {
    console.error('[Prisma Setup] ❌ ERROR: Schema must use provider = "postgresql"')
    console.error('[Prisma Setup] Found:', schemaContent.match(/provider\s*=\s*"([^"]+)"/)?.[1] || 'unknown')
    process.exit(1)
  }
  
  console.log('[Prisma Setup] ✅ Schema verified: uses postgresql provider, no Accelerate')
} catch (error) {
  console.error('[Prisma Setup] ERROR generating Prisma client:', error.message)
  process.exit(1)
}


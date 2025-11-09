import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Normalize email to lowercase
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@autodidact.fun').toLowerCase().trim()
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const adminName = process.env.ADMIN_NAME || 'Admin'

  console.log('Creating admin user with:')
  console.log(`Email: ${adminEmail}`)
  console.log(`Name: ${adminName}`)
  console.log(`Password: ${adminPassword ? '[PROVIDED]' : '[DEFAULT]'}`)

  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingUser) {
    console.log(`Admin user with email ${adminEmail} already exists.`)
    console.log('To update the password, delete the user first or update it manually.')
    return
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      passwordHash,
    }
  })

  console.log('✅ Admin user created successfully!')
  console.log(`Email: ${adminEmail}`)
  console.log(`Name: ${adminName}`)
  console.log(`ID: ${adminUser.id}`)
  console.log('\n⚠️  Make sure to set a strong password in production!')
}

main()
  .catch((e) => {
    console.error('Error creating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


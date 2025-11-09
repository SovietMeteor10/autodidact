import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'anthonyjduncalf@icloud.com').toLowerCase().trim()
  const adminPassword = process.env.ADMIN_PASSWORD || 'liverpool10!'

  console.log('Rehashing password for admin user...')
  console.log(`Email: ${adminEmail}`)

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!user) {
    console.error(`❌ User with email ${adminEmail} not found!`)
    process.exit(1)
  }

  console.log(`✅ User found: ${user.name || user.email}`)
  console.log(`Current hash length: ${user.passwordHash?.length || 0}`)

  // Rehash the password using bcryptjs
  console.log('Hashing password with bcryptjs...')
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  console.log(`New hash length: ${passwordHash.length}`)
  console.log(`Hash starts with: ${passwordHash.substring(0, 10)}...`)

  // Update the user
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  })

  console.log('✅ Password rehashed successfully!')
  console.log('You can now log in with:')
  console.log(`Email: ${adminEmail}`)
  console.log(`Password: ${adminPassword}`)
}

main()
  .catch((e) => {
    console.error('Error rehashing password:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


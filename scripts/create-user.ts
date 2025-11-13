#!/usr/bin/env tsx

/**
 * Script to create or update a user in the database
 * Usage: npx tsx scripts/create-user.ts
 * 
 * Note: This script should be run from the root directory, but uses
 * the admin's Prisma client which is generated from admin/prisma/schema.prisma
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const EMAIL = "anthonyduncalf@live.com";
const PASSWORD = "3A2336";
const NAME = "Anthony Duncalf";

// Create Prisma client - it will use DATABASE_URL from environment
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

async function main() {
  console.log("Creating user...");
  console.log(`Email: ${EMAIL}`);
  console.log(`Name: ${NAME}`);

  // Hash the password
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  console.log(`Password hash generated: ${passwordHash.substring(0, 20)}...`);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: EMAIL },
  });

  if (existingUser) {
    console.log("User already exists. Updating password...");
    const updatedUser = await prisma.user.update({
      where: { email: EMAIL },
      data: {
        passwordHash,
        name: NAME,
      },
    });
    console.log("✅ User updated successfully!");
    console.log(`User ID: ${updatedUser.id}`);
  } else {
    console.log("Creating new user...");
    const newUser = await prisma.user.create({
      data: {
        email: EMAIL,
        name: NAME,
        passwordHash,
      },
    });
    console.log("✅ User created successfully!");
    console.log(`User ID: ${newUser.id}`);
  }

  // Verify the user was created/updated
  const verifiedUser = await prisma.user.findUnique({
    where: { email: EMAIL },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  if (verifiedUser) {
    console.log("\n✅ Verification successful!");
    console.log("User details:", {
      id: verifiedUser.id,
      email: verifiedUser.email,
      name: verifiedUser.name,
      hasPasswordHash: !!verifiedUser.passwordHash,
    });
  } else {
    console.error("❌ Error: User not found after creation/update");
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


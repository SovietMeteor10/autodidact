#!/usr/bin/env tsx

/**
 * Quick script to generate a bcrypt hash for a password
 * Usage: npx tsx admin/scripts/generate-password-hash.ts
 */

import bcrypt from "bcryptjs";

const PASSWORD = "3A2336";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  console.log("\n✅ Password hash generated:");
  console.log(hash);
  console.log("\n📋 Use this in your SQL INSERT statement:");
  console.log(`\nINSERT INTO "User" (id, name, email, "passwordHash")\nVALUES (\n  gen_random_uuid(),\n  'Anthony Duncalf',\n  'anthonyduncalf@live.com',\n  '${hash}'\n);\n`);
}

main().catch(console.error);


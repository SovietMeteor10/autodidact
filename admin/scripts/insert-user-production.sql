-- SQL script to insert user into Neon Production Database
-- Run this in Neon Console → SQL Editor
-- 
-- This creates the user: anthonyduncalf@live.com / 3A2336

INSERT INTO "User" (id, name, email, "passwordHash")
VALUES (
  gen_random_uuid(),
  'Anthony Duncalf',
  'anthonyduncalf@live.com',
  '$2a$10$nz6dNtSchCWrLLKaljMsROgVD/GO.fDFp5KaBvwMAMlhbTRNLc8Nm'
)
ON CONFLICT (email) 
DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  name = EXCLUDED.name;

-- Verify the user was created
SELECT id, email, name, 
       CASE WHEN "passwordHash" IS NOT NULL THEN '✅ Has password' ELSE '❌ No password' END as password_status
FROM "User"
WHERE email = 'anthonyduncalf@live.com';


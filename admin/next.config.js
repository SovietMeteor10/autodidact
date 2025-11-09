/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Force Node.js runtime everywhere to ensure Prisma works correctly
  // Edge runtime forces Prisma Accelerate, which requires prisma:// URLs
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
}

module.exports = nextConfig


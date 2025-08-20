/** @type {import('next').NextConfig} */
import bcrypt from "bcryptjs";
import type { NextConfig } from "next";
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

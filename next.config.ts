import bcrypt from "bcryptjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcrypt']
  /* config options here */
};

export default nextConfig;

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
export {};

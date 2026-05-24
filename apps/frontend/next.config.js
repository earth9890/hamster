/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@hamster/shared'],
  turbopack: {},
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei'],
  },
};

module.exports = nextConfig;

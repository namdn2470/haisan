import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone mode: tạo .next/standalone/ tự chứa để chạy trong Docker
  output: 'standalone',
  // Trỏ về monorepo root để Next.js trace đúng workspace packages (Next.js 15+)
  outputFileTracingRoot: join(__dirname, '../../'),

  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        // API_INTERNAL_URL: dùng trong Docker (http://api:3001)
        // NEXT_PUBLIC_API_URL: fallback khi dev local
        source: '/api/:path*',
        destination: `${process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

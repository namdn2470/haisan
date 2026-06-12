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
    const apiUrl = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        // Proxy uploaded images: API stores files under /public/uploads,
        // serves them at /uploads/*. Browser can't reach api:3001 directly.
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

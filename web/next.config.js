/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.railway.app' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours cache for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://yiz-guangzhou-production.up.railway.app'
    return [
      {
        // 代理 API 请求到后端（除了 auth）
        source: '/api/((?!auth).*)', 
        destination: `${apiBase}/api/:1*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
      {
        source: '/_next/image',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' } // 24 hours for images
        ],
      },
      {
        source: '/api/assets',
        headers: [
          { key: 'Cache-Control', value: 'no-store' }
        ],
      },
    ]
  }
}

module.exports = nextConfig

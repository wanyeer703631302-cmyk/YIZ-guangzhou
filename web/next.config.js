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
    minimumCacheTTL: 60,
  },
  async rewrites() {
    return [
      {
        // 代理 API 请求到后端（除了 auth）
        source: '/api/((?!auth).*)', 
        destination: 'https://yiz-guangzhou-production.up.railway.app/api/:1*',
      },
    ]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['picsum.photos', 'i.pravatar.cc', 'res.cloudinary.com', 'yiz-guangzhou-production.up.railway.app'] 
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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

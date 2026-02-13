/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['picsum.photos', 'i.pravatar.cc', 'res.cloudinary.com'] 
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
        // 👇 修改了这里：使用正则表达式排除掉 auth 路径
        // 意思是：匹配 /api/ 中“不包含 auth”的所有路径
        source: '/api/((?!auth).*)', 
        destination: 'https://yiz-guangzhou-production.up.railway.app/api/:1*',
      },
    ]
  },
}

module.exports = nextConfig

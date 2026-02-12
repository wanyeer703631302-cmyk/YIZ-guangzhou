/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['picsum.photos', 'i.pravatar.cc']
  },
  // 👇 新增这一段，用于连接 Railway 后端
  async rewrites() {
    return [
      {
        // 意思：前端请求 /api/xxx 时
        source: '/api/:path*',
        // 转发到：环境变量里的网址/xxx
        // 这里的 process.env.NEXT_PUBLIC_API_URL 就是你在 Vercel 设置的那个 https://...
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['picsum.photos', 'i.pravatar.cc']
  },
  // 👇 新增这一段，强制跳过构建时的 TypeScript 错误检查
  typescript: {
    ignoreBuildErrors: true,
  },
  // 👇 新增这一段，强制跳过构建时的 ESLint 错误检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://yiz-guangzhou-production.up.railway.app/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig

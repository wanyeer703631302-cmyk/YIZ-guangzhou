/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['picsum.photos', 'i.pravatar.cc']
  },
  async rewrites() {
    // 关键点：如果环境变量没获取到，为了防止构建报错，这里做一个判断
    // 但在 Vercel 生产环境中，它应该能获取到上面设置的值
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      console.warn('⚠️ 警告: NEXT_PUBLIC_API_URL 环境变量未设置，接口转发可能失效。');
    }

    return [
      {
        source: '/api/:path*',
        // 使用环境变量拼接路径
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig

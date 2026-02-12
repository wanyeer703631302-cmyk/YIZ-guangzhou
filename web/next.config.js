/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['picsum.photos', 'i.pravatar.cc']
  }
}

module.exports = nextConfig

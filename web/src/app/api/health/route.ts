import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const checks = {
    database: false,
    cloudinary: false,
    timestamp: new Date().toISOString()
  }

  // 检查数据库连接
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  // 检查Cloudinary配置
  try {
    const hasCloudinaryConfig = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
    checks.cloudinary = hasCloudinaryConfig
  } catch (error) {
    console.error('Cloudinary health check failed:', error)
  }

  const isHealthy = checks.database && checks.cloudinary

  return NextResponse.json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks
  }, { 
    status: isHealthy ? 200 : 503 
  })
}
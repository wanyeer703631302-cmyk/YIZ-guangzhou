import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const body = await request.json()
    const assetId = body?.assetId as string
    const sourceUrl = body?.sourceUrl as string
    if (!assetId || !sourceUrl) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ success: false, message: 'Cloudinary 未配置，请检查环境变量' }, { status: 500 })
    }

    // Database retry helper
    const dbOp = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
      let lastError;
      for (let i = 0; i < retries; i++) {
        try {
          return await fn();
        } catch (e: any) {
          lastError = e;
          console.error(`Database operation failed (attempt ${i + 1}/${retries}):`, e.message);
          if (e.message?.includes('Server has closed the connection') || e.message?.includes('Connection lost')) {
            await new Promise(r => setTimeout(r, 500 * (i + 1)));
            continue;
          }
          throw e;
        }
      }
      throw lastError;
    };

    const result = await cloudinary.uploader.upload(sourceUrl, {
      folder: 'pincollect/versions',
      resource_type: 'image',
    })
    
    const version = await dbOp(async () => {
      return prisma.assetVersion.create({
        data: {
          assetId,
          storageUrl: result.secure_url,
          createdBy: userId,
        }
      })
    })

    return NextResponse.json({ success: true, data: version })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '创建版本失败' }, { status: 500 })
  }
}

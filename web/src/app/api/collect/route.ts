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
    const imageUrl = body?.imageUrl as string
    const title = body?.title as string | undefined
    const tags = body?.tags as string | undefined
    const folderId = body?.folderId as string | undefined
    if (!imageUrl) {
      return NextResponse.json({ success: false, message: '缺少图片地址' }, { status: 400 })
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ success: false, message: 'Cloudinary 未配置，请检查环境变量' }, { status: 500 })
    }
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'pincollect',
      resource_type: 'image',
    })
    const newAsset = await prisma.asset.create({
      data: {
        title: title || result.original_filename,
        storageUrl: result.secure_url,
        thumbnailUrl: result.secure_url.replace('/upload/', '/upload/f_auto,q_auto,c_thumb,w_400/'),
        originalUrl: imageUrl,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        mimeType: result.format,
        userId,
        folderId: folderId || null,
        sourceType: 'bookmarklet',
      },
    })
    if (tags) {
      const tagNames = tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      for (const tagName of tagNames) {
        const tag = await prisma.tag.upsert({
          where: { userId_name: { userId, name: tagName } },
          create: { userId, name: tagName },
          update: { usageCount: { increment: 1 } },
        })
        await prisma.assetTag.create({ data: { assetId: newAsset.id, tagId: tag.id } })
      }
    }
    return NextResponse.json({ success: true, data: newAsset })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '采集失败' }, { status: 500 })
  }
}

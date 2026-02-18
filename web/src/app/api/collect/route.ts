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
    const email = session?.user?.email as string | undefined
    const sessionUserId = session?.user?.id as string | undefined
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const user = await prisma.user.upsert({
      where: email ? { email } : { id: sessionUserId as string },
      update: {},
      create: {
        email: email || `user_${sessionUserId}@pincollect.local`,
        username: email ? email.split('@')[0] : `user_${(sessionUserId as string).slice(0, 8)}`,
        avatarUrl: (session?.user as any)?.image || null,
        authProvider: email ? 'oauth' : 'local'
      }
    })
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
        userId: user.id,
        folderId: folderId || null,
        sourceType: 'extension',
      },
    })
    if (tags) {
      const tagNames = tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      for (const tagName of tagNames) {
        const tag = await prisma.tag.upsert({
          where: { userId_name: { userId: user.id, name: tagName } },
          create: { userId: user.id, name: tagName },
          update: { usageCount: { increment: 1 } },
        })
        await prisma.assetTag.create({ data: { assetId: newAsset.id, tagId: tag.id } })
      }
    }
    return NextResponse.json({ success: true, data: newAsset })
  } catch (error: any) {
    let message = error?.message || '采集失败'
    if (typeof message === 'string' && /Server return invalid JSON/i.test(message)) {
      message = 'Cloudinary 服务异常或远程响应非图片内容，请检查凭据与网络'
    }
    if (typeof message === 'string' && /<!DOCTYPE/i.test(message)) {
      message = '远程返回了 HTML 页面而非图片资源，请更换图片地址或检查网络'
    }
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

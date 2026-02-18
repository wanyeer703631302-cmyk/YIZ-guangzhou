import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const tags = formData.get('tags') as string;
    const folderId = formData.get('folderId') as string;
    const description = formData.get('description') as string;
    const originalUrlInput = formData.get('originalUrl') as string;
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const sessionUserId = session?.user?.id as string | undefined;

    if (!file) {
      return NextResponse.json({ success: false, message: '未找到文件' }, { status: 400 });
    }

    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ success: false, message: 'Cloudinary 未配置，请检查环境变量' }, { status: 500 });
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
    });

    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId: user.id } });
      if (!folder) {
        return NextResponse.json({ success: false, message: '文件夹不存在或无权限' }, { status: 403 });
      }
    }

    const userId = user.id;

    // 1. 上传到 Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const cloudinaryResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'pincollect',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // 2. 存入数据库 (使用统一的 Asset 模型)
    const newAsset = await prisma.asset.create({
      data: {
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        description: description || undefined,
        storageUrl: cloudinaryResult.secure_url,
        thumbnailUrl: cloudinaryResult.secure_url.replace('/upload/', '/upload/f_auto,q_auto,c_thumb,w_400/'),
        originalUrl: originalUrlInput || cloudinaryResult.secure_url,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        fileSize: cloudinaryResult.bytes,
        mimeType: (file as any).type || cloudinaryResult.format,
        userId: userId,
        folderId: folderId || null,
        sourceType: 'upload'
      },
    });

    // 3. 处理标签
    if (tags) {
      const tagNames = tags.split(',').map(t => t.trim()).filter(Boolean);
      for (const tagName of tagNames) {
        const tag = await prisma.tag.upsert({
          where: { userId_name: { userId, name: tagName } },
          create: { userId, name: tagName },
          update: { usageCount: { increment: 1 } },
        });
        await prisma.assetTag.create({
          data: { assetId: newAsset.id, tagId: tag.id },
        });
      }
    }

    return NextResponse.json({ success: true, data: newAsset });
  } catch (error: any) {
    console.error('上传失败:', error);
    let message = error?.message || '上传失败';
    if (typeof message === 'string' && /Server return invalid JSON/i.test(message)) {
      message = 'Cloudinary 服务异常或远程响应非图片内容，请检查凭据与网络';
    }
    if (typeof message === 'string' && /<!DOCTYPE/i.test(message)) {
      message = '远程返回了 HTML 页面而非图片资源，请更换图片地址或检查网络';
    }
    return NextResponse.json(
      { success: false, message }, 
      { status: 500 }
    );
  }
}

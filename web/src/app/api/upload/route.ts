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
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string;

    if (!file) {
      return NextResponse.json({ success: false, message: '未找到文件' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ success: false, message: 'Cloudinary 未配置，请检查环境变量' }, { status: 500 });
    }

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
        storageUrl: cloudinaryResult.secure_url,
        thumbnailUrl: cloudinaryResult.secure_url.replace('/upload/', '/upload/f_auto,q_auto,c_thumb,w_400/'),
        originalUrl: cloudinaryResult.secure_url,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        fileSize: cloudinaryResult.bytes,
        mimeType: (file as any).type || cloudinaryResult.format,
        userId: userId,
        folderId: folderId || null,
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
    return NextResponse.json(
      { success: false, message: error.message || '上传失败' }, 
      { status: 500 }
    );
  }
}

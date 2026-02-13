import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client'; // 引入 Prisma

const prisma = new PrismaClient();

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

    if (!file) {
      return NextResponse.json({ message: '未找到文件' }, { status: 400 });
    }

    // 1. 上传到 Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const cloudinaryResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'pincollect' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // 2. 关键步骤：将 Cloudinary 返回的 url 存入数据库
    const newMaterial = await prisma.material.create({
      data: {
        title: title || file.name,
        url: cloudinaryResult.secure_url, // 这里存入云端地址
        tags: tags || '',
        folderId: folderId || null,
      },
    });

    return NextResponse.json(newMaterial); // 返回数据库里的这条新记录
  } catch (error: any) {
    console.error('上传并保存失败:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

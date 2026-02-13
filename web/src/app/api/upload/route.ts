import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: '未找到文件' }, { status: 400 });
    }

    // 1. 将文件转为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. 使用 upload_stream 上传到 Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'pincollect', // 你可以改文件夹名字
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // 3. 返回成功结果
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('上传出错:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

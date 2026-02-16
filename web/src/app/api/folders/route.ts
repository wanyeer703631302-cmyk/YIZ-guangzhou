import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '需要 userId' },
        { status: 400 }
      );
    }

    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        _count: { select: { assets: true } },
      },
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: folders.map(f => ({
        ...f,
        assetCount: f._count.assets,
      })),
    });
  } catch (error: any) {
    console.error('获取文件夹失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, parentId, color, description } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const folder = await prisma.folder.create({
      data: {
        userId,
        name,
        parentId,
        color: color || '#3B82F6',
        description,
      },
    });

    return NextResponse.json({ success: true, data: folder });
  } catch (error: any) {
    console.error('创建文件夹失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

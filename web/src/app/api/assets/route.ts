import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const folderId = searchParams.get('folderId');
    const searchQuery = searchParams.get('q');
    const tag = searchParams.get('tag');
    const liked = searchParams.get('liked');
  const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    
    if (userId) where.userId = userId;
    if (folderId) where.folderId = folderId;
  if (status) where.status = status;
    
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { tags: { some: { tag: { name: { contains: searchQuery, mode: 'insensitive' } } } } },
      ];
    }
    if (tag) {
      where.tags = { some: { tag: { name: { equals: tag, mode: 'insensitive' } } } };
    }
    if (liked && ['1','true','yes'].includes(liked)) {
      where.likes = { some: {} }
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

    const [assets, total] = await dbOp(async () => {
      return Promise.all([
        prisma.asset.findMany({
          where,
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
            tags: { include: { tag: { select: { name: true, color: true } } } },
          },
          orderBy: liked && ['1','true','yes'].includes(liked)
            ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
            : { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.asset.count({ where }),
      ])
    })

    return NextResponse.json({
      success: true,
      data: {
        items: assets.map(asset => ({
          ...asset,
          tags: asset.tags.map(t => t.tag.name),
          tagColors: asset.tags.map(t => t.tag.color),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('获取素材失败:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id as string;
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }
    const body = await request.json();
    const assetId = body?.assetId as string;
    if (!assetId) {
      return NextResponse.json({ success: false, message: '缺少素材ID' }, { status: 400 });
    }
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return NextResponse.json({ success: false, message: '素材不存在' }, { status: 404 });
    }
    if (asset.userId !== userId) {
      return NextResponse.json({ success: false, message: '无删除权限' }, { status: 403 });
    }
    await prisma.asset.delete({ where: { id: assetId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || '删除失败' },
      { status: 500 }
    );
  }
}

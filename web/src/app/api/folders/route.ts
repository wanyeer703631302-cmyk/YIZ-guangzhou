import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const sessionUserId = session?.user?.id as string | undefined;
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
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

    const folders = await prisma.folder.findMany({
      where: { userId: user.id },
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
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const sessionUserId = session?.user?.id as string | undefined;
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 });
    }
    const body = await request.json();
    const { name, parentId, color, description } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
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

    const folder = await prisma.folder.create({
      data: {
        userId: user.id,
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

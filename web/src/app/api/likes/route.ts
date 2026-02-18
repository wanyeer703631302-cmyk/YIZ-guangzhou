import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    const [items, total] = await dbOp(async () => {
      return Promise.all([
        prisma.like.findMany({
          where: { userId },
          include: { asset: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.like.count({ where: { userId } })
      ])
    })

    return NextResponse.json({
      success: true,
      data: { items, total, page, limit, totalPages: Math.ceil(total / limit) }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '获取失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const body = await request.json()
    const assetId = body?.assetId as string
    if (!assetId) {
      return NextResponse.json({ success: false, message: '缺少素材ID' }, { status: 400 })
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

    const existing = await dbOp(async () => {
      return prisma.like.findUnique({
        where: { userId_assetId: { userId, assetId } }
      }).catch(() => null)
    })

    if (existing) {
      await dbOp(async () => {
        return prisma.like.delete({ where: { userId_assetId: { userId, assetId } } })
      })
      return NextResponse.json({ success: true, data: { liked: false } })
    }
    await dbOp(async () => {
      return prisma.like.create({ data: { userId, assetId } })
    })
    return NextResponse.json({ success: true, data: { liked: true } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '操作失败' }, { status: 500 })
  }
}

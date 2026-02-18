import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'

const LEVELS = new Set(['夯', '顶级', '人上人'])

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const body = await request.json()
    const assetId = body?.assetId as string
    const level = body?.level as string
    if (!assetId || !level || !LEVELS.has(level)) {
      return NextResponse.json({ success: false, message: '参数错误' }, { status: 400 })
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

    const asset = await dbOp(async () => {
      return prisma.asset.findUnique({ where: { id: assetId } })
    })

    if (!asset) {
      return NextResponse.json({ success: false, message: '素材不存在' }, { status: 404 })
    }
    // 确保标签存在
    const tag = await dbOp(async () => {
      return prisma.tag.upsert({
        where: { userId_name: { userId, name: level } },
        create: { userId, name: level },
        update: {},
      })
    })

    // 移除其他等级标签（同一用户对同一素材仅一个等级）
    const otherLevels = Array.from(LEVELS).filter(l => l !== level)
    const otherTags = await dbOp(async () => {
      return prisma.tag.findMany({
        where: { userId, name: { in: otherLevels } },
        select: { id: true }
      })
    })

    if (otherTags.length > 0) {
      await dbOp(async () => {
        return prisma.assetTag.deleteMany({
          where: { assetId, tagId: { in: otherTags.map(t => t.id) } }
        })
      })
    }
    // 关联当前等级
    await dbOp(async () => {
      return prisma.assetTag.upsert({
        where: { assetId_tagId: { assetId, tagId: tag.id } },
        update: {},
        create: { assetId, tagId: tag.id }
      })
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '设置等级失败' }, { status: 500 })
  }
}

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
    const asset = await prisma.asset.findUnique({ where: { id: assetId } })
    if (!asset) {
      return NextResponse.json({ success: false, message: '素材不存在' }, { status: 404 })
    }
    // 确保标签存在
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name: level } },
      create: { userId, name: level },
      update: {},
    })
    // 移除其他等级标签（同一用户对同一素材仅一个等级）
    const otherLevels = Array.from(LEVELS).filter(l => l !== level)
    const otherTags = await prisma.tag.findMany({
      where: { userId, name: { in: otherLevels } },
      select: { id: true }
    })
    if (otherTags.length > 0) {
      await prisma.assetTag.deleteMany({
        where: { assetId, tagId: { in: otherTags.map(t => t.id) } }
      })
    }
    // 关联当前等级
    await prisma.assetTag.upsert({
      where: { assetId_tagId: { assetId, tagId: tag.id } },
      update: {},
      create: { assetId, tagId: tag.id }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '设置等级失败' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const totalAssets = await prisma.asset.count()
    const totalUsers = await prisma.user.count()
    const totalTags = await prisma.tag.count()

    const since = new Date()
    since.setDate(since.getDate() - 7)
    const uploads = await prisma.asset.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: since } },
      _count: { id: true }
    })

    const topTags = await prisma.assetTag.groupBy({
      by: ['tagId'],
      _count: { tagId: true },
      orderBy: { _count: { tagId: 'desc' } },
      take: 10
    })
    const tags = await prisma.tag.findMany({
      where: { id: { in: topTags.map(t => t.tagId) } }
    })
    const tagStats = topTags.map(t => ({
      id: t.tagId,
      name: tags.find(tag => tag.id === t.tagId)?.name || '',
      count: t._count.tagId
    }))

    const activeUsers = await prisma.asset.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    })
    const users = await prisma.user.findMany({
      where: { id: { in: activeUsers.map(u => u.userId) } },
      select: { id: true, username: true, avatarUrl: true }
    })
    const userStats = activeUsers.map(u => ({
      id: u.userId,
      name: users.find(x => x.id === u.userId)?.username || '',
      avatar: users.find(x => x.id === u.userId)?.avatarUrl || null,
      count: u._count.id
    }))

    return NextResponse.json({
      success: true,
      data: {
        totals: { assets: totalAssets, users: totalUsers, tags: totalTags },
        uploadsLast7Days: uploads.map(x => ({ date: x.createdAt, count: x._count.id })),
        topTags: tagStats,
        activeUsers: userStats
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '获取统计失败' }, { status: 500 })
  }
}

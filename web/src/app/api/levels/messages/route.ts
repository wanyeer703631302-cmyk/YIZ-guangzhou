import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'

const LEVELS = ['夯','顶级','人上人']

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const me = session?.user?.id as string | undefined
    if (!me) return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tags = await prisma.tag.findMany({
      where: { name: { in: LEVELS } },
      select: { id: true, name: true, userId: true }
    })
    const tagIds = tags.map(t => t.id)
    const [items, total] = await Promise.all([
      prisma.assetTag.findMany({
        where: {
          tagId: { in: tagIds },
          asset: { userId: me },
          tag: { userId: { not: me } }
        },
        include: {
          asset: { select: { id: true, title: true, thumbnailUrl: true, storageUrl: true } },
          tag: { select: { id: true, name: true, user: { select: { id: true, username: true, avatarUrl: true } } } }
        },
        orderBy: { addedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.assetTag.count({
        where: {
          tagId: { in: tagIds },
          asset: { userId: me },
          tag: { userId: { not: me } }
        }
      })
    ])
    const data = items.map(it => ({
      assetId: it.asset.id,
      assetTitle: it.asset.title,
      assetThumb: it.asset.thumbnailUrl || it.asset.storageUrl,
      giverId: it.tag.user?.id,
      giverName: it.tag.user?.username,
      giverAvatar: it.tag.user?.avatarUrl,
      level: it.tag.name
    }))
    return NextResponse.json({ success: true, data: { items: data, total, page, limit, totalPages: Math.ceil(total / limit) } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '获取失败' }, { status: 500 })
  }
}

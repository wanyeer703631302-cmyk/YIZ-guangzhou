import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: slug },
          { username: slug },
          { email: slug }
        ]
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        bio: true
      }
    })
    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 })
    }
    const [assetCount, likeCount, favoriteCount, topTags] = await Promise.all([
      prisma.asset.count({ where: { userId: user.id } }),
      prisma.like.count({ where: { asset: { userId: user.id } } }),
      prisma.favorite.count({ where: { asset: { userId: user.id } } }),
      prisma.tag.findMany({
        where: { userId: user.id },
        orderBy: { usageCount: 'desc' },
        take: 8,
        select: { id: true, name: true }
      })
    ])
    return NextResponse.json({
      success: true,
      data: {
        user,
        stats: {
          assets: assetCount,
          likes: likeCount,
          favorites: favoriteCount
        },
        tags: topTags
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '获取失败' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbOp } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const userId = searchParams.get('userId')

    const where: any = {
      tags: {
        some: {
          tag: {
            name: '夯'
          }
        }
      },
      status: 'approved'
    }

    const [items, total] = await dbOp(async () => {
      return Promise.all([
        prisma.asset.findMany({
          where,
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
            _count: {
              select: { likes: true, favorites: true }
            },
            likes: userId ? { where: { userId } } : false,
            favorites: userId ? { where: { userId } } : false
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.asset.count({ where })
      ])
    })

    const data = items.map(item => ({
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl || item.storageUrl,
      width: item.width,
      height: item.height,
      user: item.user,
      likesCount: item._count.likes,
      favoritesCount: item._count.favorites,
      createdAt: item.createdAt,
      isLiked: userId ? item.likes.length > 0 : false,
      isFavorited: userId ? item.favorites.length > 0 : false
    }))

    return NextResponse.json({
      success: true,
      data: {
        items: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch hang content:', error)
    // Sentry integration would go here
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

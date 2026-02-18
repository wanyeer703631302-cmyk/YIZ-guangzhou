import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = params.id
    const currentUserId = session?.user?.id
    const isOwner = currentUserId === userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        coverUrl: true,
        _count: {
          select: {
            assets: true,
            likes: true,
            favorites: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // Unread messages count if owner
    let unreadMessages = 0
    if (isOwner) {
        unreadMessages = await prisma.message.count({
            where: { userId, isRead: false }
        })
    }

    // Construct response
    const responseData = {
      id: user.id,
      name: user.username, // Map username to name for frontend compatibility
      email: isOwner ? user.email : undefined,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      isOwner,
      stats: {
        uploads: user._count.assets,
        likes: user._count.likes,
        favorites: isOwner ? user._count.favorites : undefined
      },
      unreadMessages: isOwner ? unreadMessages : undefined
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

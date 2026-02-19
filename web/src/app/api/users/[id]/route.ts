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
    const identifier = params.id
    const currentUserId = session?.user?.id

    if (!identifier) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 })
    }

    // More robust UUID detection
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
    const where = isUuid ? { id: identifier } : { username: identifier }

    const user = await prisma.user.findUnique({
      where,
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

    const userId = user.id
    const isOwner = currentUserId === userId

    // Unread messages count if owner
    let unreadMessages = 0
    if (isOwner) {
        try {
          unreadMessages = await prisma.message.count({
              where: { userId, isRead: false }
          })
        } catch (e) {
          console.error('Failed to count unread messages:', e)
          // Continue without unread count
        }
    }

    // Construct response
    const responseData = {
      id: user.id,
      name: user.username, // Map username to name for frontend compatibility
      email: isOwner ? user.email : undefined,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      image: user.avatarUrl, // Add image field for compatibility
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
    console.error('User API error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 })
  }
}

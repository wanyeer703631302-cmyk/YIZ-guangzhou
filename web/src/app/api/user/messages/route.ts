import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbOp } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string

    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const [messages, total, unreadCount] = await dbOp(async () => {
      return Promise.all([
        prisma.message.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.message.count({ where: { userId } }),
        prisma.message.count({ where: { userId, isRead: false } })
      ])
    })

    return NextResponse.json({
      success: true,
      data: {
        items: messages,
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

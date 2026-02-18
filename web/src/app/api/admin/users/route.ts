import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbOp } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const displayable = searchParams.get('displayable')
    const search = searchParams.get('search')

    const where: any = {}
    if (displayable === 'true') where.isDisplayed = true
    if (displayable === 'false') where.isDisplayed = false
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await dbOp(async () => {
      return Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            isDisplayed: true,
            email: true,
            role: true
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.user.count({ where })
      ])
    })

    return NextResponse.json({
      success: true,
      data: {
        items: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role

    if (userRole !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds, isDisplayed } = body

    if (!Array.isArray(userIds) || typeof isDisplayed !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 })
    }

    await dbOp(async () => {
      return prisma.user.updateMany({
        where: { id: { in: userIds } },
        data: { isDisplayed }
      })
    })

    // TODO: Refresh Redis cache here if Redis was implemented
    // await redis.del('home:users')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

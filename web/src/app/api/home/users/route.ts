import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbOp } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const users = await dbOp(async () => {
      return prisma.user.findMany({
        where: {
          isDisplayed: true
        },
        orderBy: {
          displayOrder: 'asc'
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          _count: {
            select: {
              assets: true
            }
          }
        }
      })
    })

    const data = users.map(user => ({
      id: user.id,
      name: user.username,
      avatar: user.avatarUrl || '', // Ensure avatar is never null
      count: user._count.assets
    }))

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Home users API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to fetch users',
      data: [] // Return empty array as fallback
    }, { status: 500 })
  }
}
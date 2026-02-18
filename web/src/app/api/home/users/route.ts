import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbOp } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const users = await dbOp(async () => {
      return prisma.user.findMany({
        where: { isDisplayed: true },
        select: {
          id: true,
          username: true,
          avatarUrl: true
        },
        orderBy: { displayOrder: 'asc' }
      })
    })
    
    return NextResponse.json({ success: true, data: users })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

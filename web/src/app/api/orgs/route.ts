import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const orgs = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: { members: { include: { user: true } }, owner: true }
    })
    return NextResponse.json({ success: true, data: orgs })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '获取失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string
    if (!userId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const body = await request.json()
    const name = body?.name as string
    if (!name) {
      return NextResponse.json({ success: false, message: '缺少组织名称' }, { status: 400 })
    }
    const org = await prisma.organization.create({
      data: {
        name,
        ownerId: userId,
        members: { create: { userId, role: 'owner' } }
      },
      include: { members: true, owner: true }
    })
    return NextResponse.json({ success: true, data: org })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '创建失败' }, { status: 500 })
  }
}

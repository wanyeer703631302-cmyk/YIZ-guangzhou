import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string | undefined
    if (!userId) return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    const body = await request.json()
    const bio = body?.bio as string | undefined
    const avatarUrl = body?.avatarUrl as string | undefined
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        bio: bio ?? undefined,
        avatarUrl: avatarUrl ?? undefined
      },
      select: { id: true, username: true, avatarUrl: true, bio: true }
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '更新失败' }, { status: 500 })
  }
}

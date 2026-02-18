import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const meId = session?.user?.id as string | undefined
    const meRole = (session as any)?.user?.role as string | undefined
    if (!meId || meRole !== 'admin') {
      return NextResponse.json({ success: false, message: '无权限' }, { status: 403 })
    }
    const body = await request.json()
    const email = (body?.email || '').trim()
    const username = (body?.username || '').trim()
    const password = (body?.password || '').trim()
    if (!email || !username || !password) {
      return NextResponse.json({ success: false, message: '缺少必要字段' }, { status: 400 })
    }
    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
    if (exists) {
      return NextResponse.json({ success: false, message: '邮箱或用户名已存在' }, { status: 409 })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hashed,
        role: 'member',
        authProvider: 'local'
      }
    })
    return NextResponse.json({ success: true, data: { id: user.id, email: user.email, username: user.username } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '创建失败' }, { status: 500 })
  }
}

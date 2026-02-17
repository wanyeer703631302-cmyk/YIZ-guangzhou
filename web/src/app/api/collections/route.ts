import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email as string | undefined
    const sessionUserId = session?.user?.id as string | undefined
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const user = await prisma.user.upsert({
      where: email ? { email } : { id: sessionUserId as string },
      update: {},
      create: {
        email: email || `user_${sessionUserId}@pincollect.local`,
        username: email ? email.split('@')[0] : `user_${(sessionUserId as string).slice(0, 8)}`,
        avatarUrl: (session?.user as any)?.image || null,
        authProvider: email ? 'oauth' : 'local'
      }
    })
    const collections = await prisma.collection.findMany({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({
      success: true,
      data: collections.map(c => ({ ...c, itemCount: c._count.items }))
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '获取失败' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email as string | undefined
    const sessionUserId = session?.user?.id as string | undefined
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const body = await request.json()
    const name = body?.name as string
    if (!name) {
      return NextResponse.json({ success: false, message: '缺少分类名称' }, { status: 400 })
    }
    const user = await prisma.user.upsert({
      where: email ? { email } : { id: sessionUserId as string },
      update: {},
      create: {
        email: email || `user_${sessionUserId}@pincollect.local`,
        username: email ? email.split('@')[0] : `user_${(sessionUserId as string).slice(0, 8)}`,
        avatarUrl: (session?.user as any)?.image || null,
        authProvider: email ? 'oauth' : 'local'
      }
    })
    const collection = await prisma.collection.create({
      data: { userId: user.id, name }
    })
    return NextResponse.json({ success: true, data: collection })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '创建失败' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email as string | undefined
    const sessionUserId = session?.user?.id as string | undefined
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const body = await request.json()
    const id = body?.id as string
    const name = body?.name as string
    if (!id || !name) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }
    const user = await prisma.user.upsert({
      where: email ? { email } : { id: sessionUserId as string },
      update: {},
      create: {
        email: email || `user_${sessionUserId}@pincollect.local`,
        username: email ? email.split('@')[0] : `user_${(sessionUserId as string).slice(0, 8)}`,
        avatarUrl: (session?.user as any)?.image || null,
        authProvider: email ? 'oauth' : 'local'
      }
    })
    const collection = await prisma.collection.update({
      where: { id },
      data: { name },
    })
    if (collection.userId !== user.id) {
      return NextResponse.json({ success: false, message: '无权限' }, { status: 403 })
    }
    return NextResponse.json({ success: true, data: collection })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '更新失败' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email as string | undefined
    const sessionUserId = session?.user?.id as string | undefined
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const body = await request.json()
    const id = body?.id as string
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }
    const user = await prisma.user.upsert({
      where: email ? { email } : { id: sessionUserId as string },
      update: {},
      create: {
        email: email || `user_${sessionUserId}@pincollect.local`,
        username: email ? email.split('@')[0] : `user_${(sessionUserId as string).slice(0, 8)}`,
        avatarUrl: (session?.user as any)?.image || null,
        authProvider: email ? 'oauth' : 'local'
      }
    })
    const collection = await prisma.collection.findUnique({ where: { id } })
    if (!collection || collection.userId !== user.id) {
      return NextResponse.json({ success: false, message: '无权限' }, { status: 403 })
    }
    await prisma.collection.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '删除失败' }, { status: 500 })
  }
}

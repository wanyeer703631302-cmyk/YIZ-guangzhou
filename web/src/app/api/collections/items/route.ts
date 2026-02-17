import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email as string | undefined
    const sessionUserId = session?.user?.id as string | undefined
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const body = await request.json()
    const collectionId = body?.collectionId as string
    const assetId = body?.assetId as string
    if (!collectionId || !assetId) {
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
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } })
    if (!collection || collection.userId !== user.id) {
      return NextResponse.json({ success: false, message: '无权限' }, { status: 403 })
    }
    await prisma.collectionItem.upsert({
      where: { collectionId_assetId: { collectionId, assetId } },
      update: {},
      create: { collectionId, assetId }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '添加失败' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email as string | undefined
    const sessionUserId = session?.user?.id as string | undefined
    if (!email && !sessionUserId) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')
    if (!assetId) {
      return NextResponse.json({ success: false, message: '缺少素材ID' }, { status: 400 })
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
    const items = await prisma.collectionItem.findMany({
      where: { assetId, collection: { userId: user.id } },
      select: { collectionId: true }
    })
    return NextResponse.json({ success: true, data: items.map(i => i.collectionId) })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '获取失败' }, { status: 500 })
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
    const collectionId = body?.collectionId as string
    const assetId = body?.assetId as string
    if (!collectionId || !assetId) {
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
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } })
    if (!collection || collection.userId !== user.id) {
      return NextResponse.json({ success: false, message: '无权限' }, { status: 403 })
    }
    await prisma.collectionItem.delete({ where: { collectionId_assetId: { collectionId, assetId } } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '移除失败' }, { status: 500 })
  }
}

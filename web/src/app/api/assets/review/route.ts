import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as any)?.role || 'user'
    if (role !== 'admin') {
      return NextResponse.json({ success: false, message: '需要管理员权限' }, { status: 403 })
    }
    const body = await request.json()
    const assetId = body?.assetId as string
    const status = body?.status as 'pending' | 'approved' | 'rejected'
    if (!assetId || !status) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }
    await prisma.asset.update({
      where: { id: assetId },
      data: { status }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '审核失败' }, { status: 500 })
  }
}

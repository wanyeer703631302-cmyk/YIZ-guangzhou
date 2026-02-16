import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        folder: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ success: true, data: assets })
  } catch (error: any) {
    console.error('获取素材失败:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

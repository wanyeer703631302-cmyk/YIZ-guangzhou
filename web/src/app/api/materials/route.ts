import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(materials)
  } catch (error) {
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
  }
}

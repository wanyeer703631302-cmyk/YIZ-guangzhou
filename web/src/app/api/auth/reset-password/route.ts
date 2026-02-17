import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const identifier = String(body?.identifier || '').trim()
    const password = String(body?.password || '')
    const code = String(body?.code || '')
    if (!identifier || !password || !code) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')
    const verify = await prisma.verificationCode.findFirst({
      where: {
        identifier,
        purpose: 'reset',
        usedAt: null,
        expiresAt: { gt: new Date() },
        codeHash
      },
      orderBy: { createdAt: 'desc' }
    })
    if (!verify) {
      return NextResponse.json({ success: false, message: '验证码无效' }, { status: 400 })
    }
    await prisma.verificationCode.update({ where: { id: verify.id }, data: { usedAt: new Date() } })
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }, { username: identifier }] }
    })
    if (!user) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 404 })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '重置失败' }, { status: 500 })
  }
}

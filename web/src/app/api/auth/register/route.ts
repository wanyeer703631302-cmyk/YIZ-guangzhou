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
    const usernameInput = String(body?.username || '').trim()
    const bio = String(body?.bio || '').trim()
    if (!identifier || !password || !code) {
      return NextResponse.json({ success: false, message: '缺少参数' }, { status: 400 })
    }
    const isEmail = identifier.includes('@')
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }, { username: identifier }] }
    })
    if (existing) {
      return NextResponse.json({ success: false, message: '账号已存在' }, { status: 400 })
    }
    const codeHash = crypto.createHash('sha256').update(code).digest('hex')
    const verify = await prisma.verificationCode.findFirst({
      where: {
        identifier,
        purpose: 'register',
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
    const baseUsername = usernameInput || (isEmail ? identifier.split('@')[0] : `user_${identifier.slice(-4)}`)
    let username = baseUsername
    let suffix = 1
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${suffix}`
      suffix += 1
    }
    const email = isEmail ? identifier : `phone_${identifier}@pincollect.local`
    const phone = isEmail ? null : identifier
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        username,
        bio: bio || null,
        passwordHash,
        authProvider: 'local'
      }
    })
    return NextResponse.json({ success: true, data: { id: user.id, username: user.username } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || '注册失败' }, { status: 500 })
  }
}

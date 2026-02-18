import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dbOp } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id as string
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { oldPassword, newPassword } = await request.json()

    if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ success: false, message: '密码需至少8位，包含大小写字母和数字' }, { status: 400 })
    }

    const user = await dbOp(async () => {
      return prisma.user.findUnique({ where: { id: userId } })
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, message: 'User not found or no password set' }, { status: 404 })
    }

    const isValid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ success: false, message: '旧密码错误' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await dbOp(async () => {
      return prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

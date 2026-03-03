/**
 * 创建管理员账号脚本
 * 使用方法: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'admin@yiz.com'
  const password = 'Admin123456' // 请在首次登录后修改密码
  const name = 'Administrator'

  try {
    // 检查是否已存在
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.log('❌ 管理员账号已存在')
      console.log('邮箱:', email)
      return
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建管理员
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ 管理员账号创建成功！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('邮箱:', email)
    console.log('密码:', password)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  请在首次登录后立即修改密码！')
    console.log('')
    console.log('用户ID:', admin.id)
    console.log('创建时间:', admin.createdAt)
  } catch (error) {
    console.error('❌ 创建管理员失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

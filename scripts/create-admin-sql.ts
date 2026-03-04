/**
 * 使用原始 SQL 创建管理员账号
 * 适用于数据库结构与 Prisma schema 不完全匹配的情况
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminWithSQL() {
  const email = 'admin@yiz.com'
  const password = 'Admin123456'
  const username = 'admin'

  try {
    // 检查是否已存在
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existing.length > 0) {
      console.log('❌ 管理员账号已存在')
      console.log('邮箱:', email)
      return
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 使用原始 SQL 创建管理员
    // 只插入数据库中实际存在的字段
    await prisma.$executeRaw`
      INSERT INTO users (email, username, password_hash, role, created_at, updated_at)
      VALUES (${email}, ${username}, ${hashedPassword}, 'ADMIN', NOW(), NOW())
    `

    console.log('✅ 管理员账号创建成功！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('邮箱:', email)
    console.log('密码:', password)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  请在首次登录后立即修改密码！')
  } catch (error) {
    console.error('❌ 创建管理员失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminWithSQL()

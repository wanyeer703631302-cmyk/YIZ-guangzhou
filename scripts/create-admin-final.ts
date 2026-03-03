/**
 * 创建管理员账号 - 匹配实际数据库结构
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = 'admin@yiz.com'
  const username = 'admin'
  const password = 'Admin123456'

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

    // 创建管理员账号
    await prisma.$executeRaw`
      INSERT INTO users (
        id,
        email,
        username,
        password_hash,
        role,
        auth_provider,
        created_at,
        updated_at,
        failed_login_count,
        display_order,
        is_displayed
      ) VALUES (
        gen_random_uuid()::text,
        ${email},
        ${username},
        ${hashedPassword},
        'admin',
        'local',
        NOW(),
        NOW(),
        0,
        0,
        true
      )
    `

    console.log('✅ 管理员账号创建成功！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('邮箱:', email)
    console.log('用户名:', username)
    console.log('密码:', password)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  请在首次登录后立即修改密码！')
  } catch (error) {
    console.error('❌ 创建管理员失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

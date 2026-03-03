/**
 * 检查数据库表结构
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStructure() {
  try {
    // 查询 users 表结构
    const columns = await prisma.$queryRaw<Array<{
      column_name: string
      data_type: string
      is_nullable: string
    }>>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `

    console.log('📋 users 表结构:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    columns.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(必填)' : '(可选)'}`)
    })

    // 查询现有用户
    const users = await prisma.$queryRaw<Array<{
      id: string
      email: string
      role: string
    }>>`
      SELECT id, email, role FROM users
    `

    console.log('\n👥 现有用户:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    users.forEach(user => {
      console.log(`${user.email} - ${user.role}`)
    })
  } catch (error) {
    console.error('❌ 查询失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStructure()

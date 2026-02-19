// 设置用户在首页显示的脚本
// 运行: node scripts/set-displayed-users.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 查找所有用户...')
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      isDisplayed: true,
      displayOrder: true,
      _count: {
        select: {
          assets: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`\n找到 ${users.length} 个用户:\n`)
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.username} (${user.email})`)
    console.log(`   - ID: ${user.id}`)
    console.log(`   - 素材数: ${user._count.assets}`)
    console.log(`   - 是否显示: ${user.isDisplayed ? '✅ 是' : '❌ 否'}`)
    console.log(`   - 显示顺序: ${user.displayOrder}`)
    console.log('')
  })

  // 自动设置前3个有素材的用户为显示状态
  const usersWithAssets = users.filter(u => u._count.assets > 0).slice(0, 3)
  
  if (usersWithAssets.length > 0) {
    console.log('📝 自动设置以下用户为显示状态:\n')
    
    for (let i = 0; i < usersWithAssets.length; i++) {
      const user = usersWithAssets[i]
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isDisplayed: true,
          displayOrder: i + 1
        }
      })
      console.log(`✅ ${user.username} - 显示顺序: ${i + 1}`)
    }
    
    console.log('\n✨ 完成！首页用户头像tab现在应该可以显示了。')
  } else {
    console.log('⚠️  没有找到有素材的用户。请先上传一些素材。')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

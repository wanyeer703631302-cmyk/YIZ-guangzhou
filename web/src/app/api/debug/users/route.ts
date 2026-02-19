import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    // 获取所有用户信息
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
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

    // 获取显示的用户
    const displayedUsers = allUsers.filter(u => u.isDisplayed)

    // 统计信息
    const stats = {
      totalUsers: allUsers.length,
      displayedUsers: displayedUsers.length,
      usersWithAssets: allUsers.filter(u => u._count.assets > 0).length
    }

    return NextResponse.json({
      success: true,
      stats,
      allUsers: allUsers.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        hasAvatar: !!u.avatarUrl,
        avatarUrl: u.avatarUrl,
        isDisplayed: u.isDisplayed,
        displayOrder: u.displayOrder,
        assetsCount: u._count.assets
      })),
      displayedUsers: displayedUsers.map(u => ({
        id: u.id,
        username: u.username,
        displayOrder: u.displayOrder,
        assetsCount: u._count.assets
      })),
      recommendations: generateRecommendations(allUsers, displayedUsers)
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

function generateRecommendations(allUsers: any[], displayedUsers: any[]) {
  const recommendations = []

  if (allUsers.length === 0) {
    recommendations.push({
      type: 'error',
      message: '数据库中没有用户。请先注册用户。'
    })
  }

  if (displayedUsers.length === 0) {
    recommendations.push({
      type: 'warning',
      message: '没有用户被设置为显示状态。首页用户头像tab将为空。',
      action: '运行: node scripts/set-displayed-users.js'
    })
  }

  const usersWithAssets = allUsers.filter(u => u._count.assets > 0)
  if (usersWithAssets.length === 0) {
    recommendations.push({
      type: 'info',
      message: '没有用户上传过素材。建议先上传一些内容。'
    })
  }

  const usersWithoutAvatar = allUsers.filter(u => !u.avatarUrl)
  if (usersWithoutAvatar.length > 0) {
    recommendations.push({
      type: 'info',
      message: `${usersWithoutAvatar.length} 个用户没有设置头像。将显示首字母占位符。`
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: '一切正常！✨'
    })
  }

  return recommendations
}
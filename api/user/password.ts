import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth, type AuthRequest, generateToken } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { validatePasswordComplexity, hashPassword, verifyPassword } from '../../lib/password'
import { createAuditLog } from '../../lib/audit'

/**
 * 密码管理API端点
 * 
 * POST /api/user/password - 修改密码（普通用户和管理员）
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const authReq = req as AuthRequest

  // 需要认证
  await new Promise<void>((resolve) => {
    withAuth(authReq, res, resolve)
  })

  if (!authReq.userId) {
    return
  }

  const { currentPassword, newPassword, isForceChange } = req.body

  // 验证必填字段
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: '当前密码和新密码为必填项'
    })
  }

  // 验证新密码复杂度
  const validation = validatePasswordComplexity(newPassword)
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: '密码不符合复杂度要求',
      details: validation.errors
    })
  }

  try {
    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    // 验证当前密码
    const isPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '当前密码不正确'
      })
    }

    // 如果是强制修改，防止重用临时密码
    if (isForceChange && user.requirePasswordChange) {
      const isSamePassword = await verifyPassword(newPassword, user.password)
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          error: '新密码不能与临时密码相同'
        })
      }
    }

    // 哈希新密码
    const hashedPassword = await hashPassword(newPassword)

    // 更新密码并清除requirePasswordChange标记
    await prisma.user.update({
      where: { id: authReq.userId },
      data: {
        password: hashedPassword,
        requirePasswordChange: false
      }
    })

    // 记录审计日志
    await createAuditLog(
      'USER_PASSWORD_CHANGED',
      authReq.userId,
      authReq.userId,
      {
        isForceChange: isForceChange || false
      },
      req
    )

    // 生成新的token（不再包含requirePasswordChange标记）
    const newToken = generateToken(user.id, user.role, false)

    return res.status(200).json({
      success: true,
      message: '密码修改成功',
      data: {
        token: newToken
      }
    })
  } catch (error) {
    console.error('Password change error:', error)
    return res.status(500).json({
      success: false,
      error: '密码修改失败'
    })
  }
}

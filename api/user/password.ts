import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth, type AuthRequest, generateToken } from '../_lib/auth'
import { prisma } from '../_lib/prisma'
import { validatePasswordComplexity, hashPassword, verifyPassword } from '../_lib/password'
import { createAuditLog } from '../_lib/audit'

/**
 * 密�?管�?API端点
 * 
 * POST /api/user/password - 修改密�?（普?�用?��?管�??��?
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const authReq = req as AuthRequest

  // ?�要认�?
  await new Promise<void>((resolve) => {
    withAuth(authReq, res, resolve)
  })

  if (!authReq.userId) {
    return
  }

  const { currentPassword, newPassword, isForceChange } = req.body

  // 验�?必填字段
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: '当�?密�??�新密�?为�?填项'
    })
  }

  // 验�??��??��??�度
  const validation = validatePasswordComplexity(newPassword)
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      error: '密�?不符?��??�度要�?',
      details: validation.errors
    })
  }

  try {
    // ?��??�户信息
    const user = await prisma.user.findUnique({
      where: { id: authReq.userId }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '?�户不�???
      })
    }

    // 验�?当�?密�?
    const isPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '当�?密�?不正�?
      })
    }

    // 如�??�强?�修?��??�止?�用临时密�?
    if (isForceChange && user.requirePasswordChange) {
      const isSamePassword = await verifyPassword(newPassword, user.password)
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          error: '?��??��??��?临时密�??��?'
        })
      }
    }

    // ?��??��???
    const hashedPassword = await hashPassword(newPassword)

    // ?�新密�?并�??�requirePasswordChange?�记
    await prisma.user.update({
      where: { id: authReq.userId },
      data: {
        password: hashedPassword,
        requirePasswordChange: false
      }
    })

    // 记�?审计?��?
    await createAuditLog(
      'USER_PASSWORD_CHANGED',
      authReq.userId,
      authReq.userId,
      {
        isForceChange: isForceChange || false
      },
      req
    )

    // ?��??��?token（�??��??�requirePasswordChange?�记�?
    const newToken = generateToken(user.id, user.role, false)

    return res.status(200).json({
      success: true,
      message: '密�?修改?��?',
      data: {
        token: newToken
      }
    })
  } catch (error) {
    console.error('Password change error:', error)
    return res.status(500).json({
      success: false,
      error: '密�?修改失败'
    })
  }
}


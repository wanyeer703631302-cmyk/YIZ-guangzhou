import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth, withRole, type AuthRequest, type UserRole } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { generateTemporaryPassword, hashPassword } from '../../../lib/password'
import { createAuditLog } from '../../../lib/audit'

/**
 * 单个用户管理API端点
 * 
 * PUT /api/user/manage/:userId - 更新用户信息（仅管理员）
 * DELETE /api/user/manage/:userId - 删除用户（仅管理员）
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authReq = req as AuthRequest

  // 所有操作都需要认证
  await new Promise<void>((resolve) => {
    withAuth(authReq, res, resolve)
  })

  if (!authReq.userId) {
    return
  }

  // 所有操作都需要管理员权限
  await new Promise<void>((resolve) => {
    withRole('ADMIN')(authReq, res, resolve)
  })

  if (authReq.userRole !== 'ADMIN') {
    return
  }

  const userId = req.query.userId as string

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '缺少用户ID'
    })
  }

  try {
    switch (req.method) {
      case 'PUT':
        return await handleUpdateUser(authReq, res, userId)
      case 'DELETE':
        return await handleDeleteUser(authReq, res, userId)
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('User management error:', error)
    return res.status(500).json({
      success: false,
      error: '服务器错误'
    })
  }
}

/**
 * 更新用户信息
 */
async function handleUpdateUser(req: AuthRequest, res: VercelResponse, userId: string) {
  const { name, role, resetPassword } = req.body

  // 防止管理员修改自己的角色
  if (role && userId === req.userId) {
    return res.status(403).json({
      success: false,
      error: '不能修改自己的角色'
    })
  }

  // 验证角色
  if (role && role !== 'ADMIN' && role !== 'USER') {
    return res.status(400).json({
      success: false,
      error: '角色必须是 ADMIN 或 USER'
    })
  }

  try {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    // 构建更新数据
    const updateData: any = {}
    const auditDetails: any = {}

    if (name) {
      updateData.name = name
      auditDetails.name = name
    }

    if (role) {
      updateData.role = role
      auditDetails.oldRole = existingUser.role
      auditDetails.newRole = role
    }

    let temporaryPassword: string | undefined

    if (resetPassword) {
      temporaryPassword = generateTemporaryPassword()
      updateData.password = await hashPassword(temporaryPassword)
      updateData.requirePasswordChange = true
      auditDetails.passwordReset = true
    }

    // 更新用户
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    // 记录审计日志
    const auditAction = role && role !== existingUser.role
      ? 'USER_ROLE_CHANGED'
      : resetPassword
      ? 'USER_PASSWORD_RESET'
      : 'USER_UPDATED'

    await createAuditLog(
      auditAction,
      req.userId!,
      userId,
      auditDetails,
      req
    )

    return res.status(200).json({
      success: true,
      data: {
        user,
        ...(temporaryPassword && { temporaryPassword })
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    return res.status(500).json({
      success: false,
      error: '更新用户失败'
    })
  }
}

/**
 * 删除用户
 */
async function handleDeleteUser(req: AuthRequest, res: VercelResponse, userId: string) {
  // 防止删除自己
  if (userId === req.userId) {
    return res.status(403).json({
      success: false,
      error: '不能删除自己的账号'
    })
  }

  try {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      })
    }

    // 检查是否为最后一个管理员
    if (existingUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })

      if (adminCount <= 1) {
        return res.status(403).json({
          success: false,
          error: '不能删除最后一个管理员账号'
        })
      }
    }

    // 删除用户
    await prisma.user.delete({
      where: { id: userId }
    })

    // 记录审计日志
    await createAuditLog(
      'USER_DELETED',
      req.userId!,
      userId,
      {
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role
      },
      req
    )

    return res.status(200).json({
      success: true,
      message: '用户已删除'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return res.status(500).json({
      success: false,
      error: '删除用户失败'
    })
  }
}

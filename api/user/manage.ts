import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth, withRole, type AuthRequest, type UserRole } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import { generateTemporaryPassword, hashPassword, validatePasswordComplexity } from '../../lib/password'
import { createAuditLog } from '../../lib/audit'

/**
 * 用户管理API端点
 * 
 * POST /api/user/manage - 创建新用户（仅管理员）
 * GET /api/user/manage - 获取用户列表（仅管理员）
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

  try {
    switch (req.method) {
      case 'POST':
        return await handleCreateUser(authReq, res)
      case 'GET':
        return await handleGetUsers(authReq, res)
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
 * 创建新用户
 */
async function handleCreateUser(req: AuthRequest, res: VercelResponse) {
  const { email, name, role = 'USER' } = req.body

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: '邮箱格式无效'
    })
  }

  // 验证必填字段
  if (!name) {
    return res.status(400).json({
      success: false,
      error: '姓名为必填项'
    })
  }

  // 验证角色
  if (role !== 'ADMIN' && role !== 'USER') {
    return res.status(400).json({
      success: false,
      error: '角色必须是 ADMIN 或 USER'
    })
  }

  try {
    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: '该邮箱已被使用'
      })
    }

    // 生成临时密码
    const temporaryPassword = generateTemporaryPassword()
    const hashedPassword = await hashPassword(temporaryPassword)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role as UserRole,
        requirePasswordChange: true,
        createdBy: req.userId!
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    // 记录审计日志
    await createAuditLog(
      'USER_CREATED',
      req.userId!,
      user.id,
      {
        email: user.email,
        name: user.name,
        role: user.role
      },
      req
    )

    return res.status(201).json({
      success: true,
      data: {
        user,
        temporaryPassword
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    return res.status(500).json({
      success: false,
      error: '创建用户失败'
    })
  }
}

/**
 * 获取用户列表
 */
async function handleGetUsers(req: AuthRequest, res: VercelResponse) {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 50
  const skip = (page - 1) * limit

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count()
    ])

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    return res.status(500).json({
      success: false,
      error: '获取用户列表失败'
    })
  }
}

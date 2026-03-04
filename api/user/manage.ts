import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth, withRole, type AuthRequest, type UserRole } from '../_lib/auth'
import { prisma } from '../_lib/prisma'
import { generateTemporaryPassword, hashPassword, validatePasswordComplexity } from '../_lib/password'
import { createAuditLog } from '../_lib/audit'

/**
 * ?�户管�?API端点
 * 
 * POST /api/user/manage - ?�建?�用?��?仅管?��?�?
 * GET /api/user/manage - ?��??�户?�表（�?管�??��?
 * PUT /api/user/manage/:userId - ?�新?�户信息（�?管�??��?
 * DELETE /api/user/manage/:userId - ?�除?�户（�?管�??��?
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authReq = req as AuthRequest

  // ?�?��?作都?�要认�?
  await new Promise<void>((resolve) => {
    withAuth(authReq, res, resolve)
  })

  if (!authReq.userId) {
    return
  }

  // ?�?��?作都?�要管?��??��?
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
      error: '服务异常'
    })
  }
}

/**
 * ?�建?�用??
 */
async function handleCreateUser(req: AuthRequest, res: VercelResponse) {
  const { email, name, role = 'USER' } = req.body

  // 验�??�箱?��?
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: '?�箱?��??��?'
    })
  }

  // 验�?必填字段
  if (!name) {
    return res.status(400).json({
      success: false,
      error: '姓�?为�?填项'
    })
  }

  // 验�?角色
  if (role !== 'ADMIN' && role !== 'USER') {
    return res.status(400).json({
      success: false,
      error: '角色必须??ADMIN ??USER'
    })
  }

  try {
    // 检?�邮箱是?�已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: '该邮箱已被使用'
      })
    }

    // ?��?临时密�?
    const temporaryPassword = generateTemporaryPassword()
    const hashedPassword = await hashPassword(temporaryPassword)

    // ?�建?�户
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

    // 记�?审计?��?
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
 * ?��??�户?�表
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


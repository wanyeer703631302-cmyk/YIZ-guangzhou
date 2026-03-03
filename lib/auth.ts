import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export type UserRole = 'ADMIN' | 'USER'

export interface JWTPayload {
  userId: string
  role: UserRole
  requirePasswordChange?: boolean
}

export interface AuthRequest extends VercelRequest {
  userId?: string
  userRole?: UserRole
  requirePasswordChange?: boolean
}

/**
 * 认证中间件 - 保护需要认证的API端点
 * 验证JWT令牌并将用户ID、角色和密码修改标记附加到请求对象
 * 
 * @param req - Vercel请求对象
 * @param res - Vercel响应对象
 * @param next - 下一个处理函数
 */
export function withAuth(
  req: AuthRequest,
  res: VercelResponse,
  next: () => void | Promise<void>
): void {
  try {
    const authHeader = req.headers.authorization
    const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined

    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    req.userId = decoded.userId
    req.userRole = decoded.role
    req.requirePasswordChange = decoded.requirePasswordChange

    next()
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

/**
 * 生成JWT令牌
 * 
 * @param userId - 用户ID
 * @param role - 用户角色
 * @param requirePasswordChange - 是否需要修改密码
 * @returns JWT令牌字符串，有效期7天
 */
export function generateToken(
  userId: string,
  role: UserRole = 'USER',
  requirePasswordChange: boolean = false
): string {
  const payload: JWTPayload = {
    userId,
    role,
    requirePasswordChange
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * 角色验证中间件 - 保护需要特定角色的API端点
 * 
 * @param requiredRole - 需要的角色
 * @returns 中间件函数
 */
export function withRole(requiredRole: UserRole) {
  return (req: AuthRequest, res: VercelResponse, next: () => void | Promise<void>): void => {
    if (!req.userRole) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }

    if (req.userRole !== requiredRole) {
      res.status(403).json({ success: false, error: 'Forbidden: Insufficient permissions' })
      return
    }

    next()
  }
}

/**
 * 密码修改检查中间件 - 强制要求修改临时密码
 * 
 * @param req - Vercel请求对象
 * @param res - Vercel响应对象
 * @param next - 下一个处理函数
 */
export function withPasswordChangeCheck(
  req: AuthRequest,
  res: VercelResponse,
  next: () => void | Promise<void>
): void {
  if (req.requirePasswordChange) {
    res.status(403).json({
      success: false,
      error: 'Password change required',
      requirePasswordChange: true
    })
    return
  }

  next()
}

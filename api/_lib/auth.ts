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
 * 认�?中间�?- 保护?�要认证�?API端点
 * 验�?JWT令�?并�??�户ID?��??��?密�?修改?�记?��??�请求对�?
 * 
 * @param req - Vercel请�?对象
 * @param res - Vercel?��?对象
 * @param next - 下�?个�??�函??
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
  } catch (_error) {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

/**
 * ?��?JWT令�?
 * 
 * @param userId - ?�户ID
 * @param role - ?�户角色
 * @param requirePasswordChange - ?�否?�要修?��???
 * @returns JWT令�?字符串�??��???�?
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
 * 角色验�?中间�?- 保护?�要特定�??��?API端点
 * 
 * @param requiredRole - ?�要�?角色
 * @returns 中间件函??
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
 * 密�?修改检?�中?�件 - 强制要�?修改临时密�?
 * 
 * @param req - Vercel请�?对象
 * @param res - Vercel?��?对象
 * @param next - 下�?个�??�函??
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


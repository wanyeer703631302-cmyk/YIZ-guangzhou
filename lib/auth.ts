import type { VercelRequest, VercelResponse } from '@vercel/node'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthRequest extends VercelRequest {
  userId?: string
}

/**
 * 认证中间件 - 保护需要认证的API端点
 * 验证JWT令牌并将用户ID附加到请求对象
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

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    req.userId = decoded.userId

    next()
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

/**
 * 生成JWT令牌
 * 
 * @param userId - 用户ID
 * @returns JWT令牌字符串，有效期7天
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

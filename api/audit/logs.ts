import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth, withRole, type AuthRequest } from '../../lib/auth'
import { getAuditLogs, type AuditAction } from '../../lib/audit'

/**
 * 审计日志查询API端点
 * 
 * GET /api/audit/logs - 获取审计日志列表（仅管理员）
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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

  // 需要管理员权限
  await new Promise<void>((resolve) => {
    withRole('ADMIN')(authReq, res, resolve)
  })

  if (authReq.userRole !== 'ADMIN') {
    return
  }

  try {
    // 解析查询参数
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const action = req.query.action as AuditAction | undefined
    const performedById = req.query.performedById as string | undefined
    const targetUserId = req.query.targetUserId as string | undefined
    
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string)
    }

    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string)
    }

    // 查询审计日志
    const result = await getAuditLogs({
      page,
      limit,
      action,
      startDate,
      endDate,
      performedById,
      targetUserId
    })

    return res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    return res.status(500).json({
      success: false,
      error: '获取审计日志失败'
    })
  }
}

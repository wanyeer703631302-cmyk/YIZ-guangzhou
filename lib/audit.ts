import type { VercelRequest } from '@vercel/node'
import { prisma } from './prisma'

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'USER_PASSWORD_RESET'
  | 'USER_PASSWORD_CHANGED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'

export interface AuditLogDetails {
  [key: string]: any
}

/**
 * 创建审计日志记录
 * 
 * @param action - 操作类型
 * @param performedById - 执行操作的用户ID
 * @param targetUserId - 目标用户ID（可选）
 * @param details - 操作详情（可选）
 * @param req - 请求对象（用于提取IP和User Agent）
 * @returns 创建的审计日志记录
 */
export async function createAuditLog(
  action: AuditAction,
  performedById: string,
  targetUserId?: string,
  details?: AuditLogDetails,
  req?: VercelRequest
): Promise<void> {
  try {
    // 提取IP地址
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.socket?.remoteAddress ||
        'unknown'
      : 'unknown'

    // 提取User Agent
    const userAgent = req ? (req.headers['user-agent'] as string) || 'unknown' : 'unknown'

    // 创建审计日志
    await prisma.auditLog.create({
      data: {
        action,
        performedById,
        targetUserId: targetUserId || null,
        details: details || null,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    // 记录错误但不抛出，避免影响主要业务逻辑
    console.error('Failed to create audit log:', error)
  }
}

/**
 * 查询审计日志
 * 
 * @param options - 查询选项
 * @returns 审计日志列表和总数
 */
export async function getAuditLogs(options: {
  page?: number
  limit?: number
  action?: AuditAction
  startDate?: Date
  endDate?: Date
  performedById?: string
  targetUserId?: string
}) {
  const {
    page = 1,
    limit = 50,
    action,
    startDate,
    endDate,
    performedById,
    targetUserId
  } = options

  const skip = (page - 1) * limit

  // 构建查询条件
  const where: any = {}

  if (action) {
    where.action = action
  }

  if (performedById) {
    where.performedById = performedById
  }

  if (targetUserId) {
    where.targetUserId = targetUserId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
  }

  // 查询日志
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        performedBy: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    }),
    prisma.auditLog.count({ where })
  ])

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

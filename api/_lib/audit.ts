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
 * ?›å»ºå®¡è®¡?¥å?è®°å?
 * 
 * @param action - ?ä?ç±»å?
 * @param performedById - ?§è??ä??„ç”¨?·ID
 * @param targetUserId - ?®æ??¨æˆ·IDï¼ˆå¯?‰ï?
 * @param details - ?ä?è¯¦æ?ï¼ˆå¯?‰ï?
 * @param req - è¯·æ?å¯¹è±¡ï¼ˆç”¨äºæ??–IP?ŒUser Agentï¼?
 * @returns ?›å»º?„å®¡è®¡æ—¥å¿—è®°å½?
 */
export async function createAuditLog(
  action: AuditAction,
  performedById: string,
  targetUserId?: string,
  details?: AuditLogDetails,
  req?: VercelRequest
): Promise<void> {
  try {
    // ?å?IP?°å?
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.socket?.remoteAddress ||
        'unknown'
      : 'unknown'

    // ?å?User Agent
    const userAgent = req ? (req.headers['user-agent'] as string) || 'unknown' : 'unknown'

    // ?›å»ºå®¡è®¡?¥å?
    await prisma.auditLog.create({
      data: {
        action,
        performedById,
        targetUserId: targetUserId || null,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    // è®°å??™è¯¯ä½†ä??›å‡ºï¼Œé¿?å½±?ä¸»è¦ä??¡é€»è?
    console.error('Failed to create audit log:', error)
  }
}

/**
 * ?¥è¯¢å®¡è®¡?¥å?
 * 
 * @param options - ?¥è¯¢?‰é¡¹
 * @returns å®¡è®¡?¥å??—è¡¨?Œæ€»æ•°
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

  // ?„å»º?¥è¯¢?¡ä»¶
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

  // ?¥è¯¢?¥å?
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


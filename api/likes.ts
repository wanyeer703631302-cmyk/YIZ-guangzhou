/**
 * Likes API Endpoint
 * 
 * POST /api/likes - Create a like on an asset
 * DELETE /api/likes/:id - Remove a like
 * 
 * Validates Requirements: 8.1, 8.4, 8.5
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma'
import { withAuth, AuthRequest } from '../lib/auth'

/**
 * Standard API response interface
 */
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Like data interface
 */
interface LikeData {
  id: string
  assetId: string
  userId: string
  createdAt: string
}

/**
 * Main likes handler
 * Handles both POST (create) and DELETE (remove) operations
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Handle POST - Create like
  if (req.method === 'POST') {
    return handleCreateLike(req, res)
  }

  // Handle DELETE - Remove like
  if (req.method === 'DELETE') {
    return handleDeleteLike(req, res)
  }

  // Method not allowed
  res.status(405).json({
    success: false,
    error: 'Method not allowed'
  })
}

/**
 * POST /api/likes
 * Create a like on an asset
 * 
 * Headers: { Authorization: 'Bearer {token}' }
 * Body: { assetId: string }
 * 
 * Response: { success, data: Like }
 */
async function handleCreateLike(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  withAuth(req as AuthRequest, res, async () => {
    try {
      const authReq = req as AuthRequest
      const { assetId } = req.body as { assetId?: string }

      // Validate request body
      if (!assetId) {
        res.status(400).json({
          success: false,
          error: '缺少必需参数: assetId'
        })
        return
      }

      // Check if asset exists
      const asset = await prisma.asset.findUnique({
        where: { id: assetId }
      })

      if (!asset) {
        res.status(404).json({
          success: false,
          error: '资源不存在'
        })
        return
      }

      // Check if user already liked this asset
      const existingLike = await prisma.like.findUnique({
        where: {
          assetId_userId: {
            assetId,
            userId: authReq.userId!
          }
        }
      })

      if (existingLike) {
        // Return existing like instead of error
        const response: ApiResponse<LikeData> = {
          success: true,
          data: {
            id: existingLike.id,
            assetId: existingLike.assetId,
            userId: existingLike.userId,
            createdAt: existingLike.createdAt.toISOString()
          }
        }
        res.status(200).json(response)
        return
      }

      // Create new like
      const like = await prisma.like.create({
        data: {
          assetId,
          userId: authReq.userId!
        }
      })

      const response: ApiResponse<LikeData> = {
        success: true,
        data: {
          id: like.id,
          assetId: like.assetId,
          userId: like.userId,
          createdAt: like.createdAt.toISOString()
        }
      }

      res.status(201).json(response)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line no-console
      console.error('Create like error:', errorMessage)
      res.status(500).json({
        success: false,
        error: '创建点赞失败，请稍后重试'
      })
    }
  })
}

/**
 * DELETE /api/likes/:id
 * Remove a like
 * 
 * Headers: { Authorization: 'Bearer {token}' }
 * URL params: id (like ID)
 * 
 * Response: { success }
 */
async function handleDeleteLike(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  withAuth(req as AuthRequest, res, async () => {
    try {
      const authReq = req as AuthRequest
      
      // Extract like ID from URL path
      // URL format: /api/likes/:id or /api/likes?id=xxx
      const urlParts = req.url?.split('/') || []
      const likeId = urlParts[urlParts.length - 1]?.split('?')[0] || req.query.id as string

      if (!likeId) {
        res.status(400).json({
          success: false,
          error: '缺少必需参数: id'
        })
        return
      }

      // Check if like exists and belongs to user
      const like = await prisma.like.findUnique({
        where: { id: likeId }
      })

      if (!like) {
        res.status(404).json({
          success: false,
          error: '点赞记录不存在'
        })
        return
      }

      // Verify the like belongs to the authenticated user
      if (like.userId !== authReq.userId) {
        res.status(403).json({
          success: false,
          error: '无权删除此点赞记录'
        })
        return
      }

      // Delete the like
      await prisma.like.delete({
        where: { id: likeId }
      })

      const response: ApiResponse = {
        success: true
      }

      res.status(200).json(response)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line no-console
      console.error('Delete like error:', errorMessage)
      res.status(500).json({
        success: false,
        error: '删除点赞失败，请稍后重试'
      })
    }
  })
}

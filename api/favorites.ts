/**
 * Favorites API Endpoint
 * 
 * POST /api/favorites - Create a favorite on an asset
 * DELETE /api/favorites/:id - Remove a favorite
 * 
 * Validates Requirements: 8.2, 8.6, 8.7
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
 * Favorite data interface
 */
interface FavoriteData {
  id: string
  assetId: string
  userId: string
  createdAt: string
}

/**
 * Main favorites handler
 * Handles both POST (create) and DELETE (remove) operations
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Handle POST - Create favorite
  if (req.method === 'POST') {
    return handleCreateFavorite(req, res)
  }

  // Handle DELETE - Remove favorite
  if (req.method === 'DELETE') {
    return handleDeleteFavorite(req, res)
  }

  // Method not allowed
  res.status(405).json({
    success: false,
    error: 'Method not allowed'
  })
}

/**
 * POST /api/favorites
 * Create a favorite on an asset
 * 
 * Headers: { Authorization: 'Bearer {token}' }
 * Body: { assetId: string }
 * 
 * Response: { success, data: Favorite }
 */
async function handleCreateFavorite(
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

      // Check if user already favorited this asset
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          assetId_userId: {
            assetId,
            userId: authReq.userId!
          }
        }
      })

      if (existingFavorite) {
        // Return existing favorite instead of error
        const response: ApiResponse<FavoriteData> = {
          success: true,
          data: {
            id: existingFavorite.id,
            assetId: existingFavorite.assetId,
            userId: existingFavorite.userId,
            createdAt: existingFavorite.createdAt.toISOString()
          }
        }
        res.status(200).json(response)
        return
      }

      // Create new favorite
      const favorite = await prisma.favorite.create({
        data: {
          assetId,
          userId: authReq.userId!
        }
      })

      const response: ApiResponse<FavoriteData> = {
        success: true,
        data: {
          id: favorite.id,
          assetId: favorite.assetId,
          userId: favorite.userId,
          createdAt: favorite.createdAt.toISOString()
        }
      }

      res.status(201).json(response)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line no-console
      console.error('Create favorite error:', errorMessage)
      res.status(500).json({
        success: false,
        error: '创建收藏失败，请稍后重试'
      })
    }
  })
}

/**
 * DELETE /api/favorites/:id
 * Remove a favorite
 * 
 * Headers: { Authorization: 'Bearer {token}' }
 * URL params: id (favorite ID)
 * 
 * Response: { success }
 */
async function handleDeleteFavorite(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  withAuth(req as AuthRequest, res, async () => {
    try {
      const authReq = req as AuthRequest
      
      // Extract favorite ID from URL path
      // URL format: /api/favorites/:id or /api/favorites?id=xxx
      const urlParts = req.url?.split('/') || []
      const favoriteId = urlParts[urlParts.length - 1]?.split('?')[0] || req.query.id as string

      if (!favoriteId) {
        res.status(400).json({
          success: false,
          error: '缺少必需参数: id'
        })
        return
      }

      // Check if favorite exists and belongs to user
      const favorite = await prisma.favorite.findUnique({
        where: { id: favoriteId }
      })

      if (!favorite) {
        res.status(404).json({
          success: false,
          error: '收藏记录不存在'
        })
        return
      }

      // Verify the favorite belongs to the authenticated user
      if (favorite.userId !== authReq.userId) {
        res.status(403).json({
          success: false,
          error: '无权删除此收藏记录'
        })
        return
      }

      // Delete the favorite
      await prisma.favorite.delete({
        where: { id: favoriteId }
      })

      const response: ApiResponse = {
        success: true
      }

      res.status(200).json(response)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line no-console
      console.error('Delete favorite error:', errorMessage)
      res.status(500).json({
        success: false,
        error: '删除收藏失败，请稍后重试'
      })
    }
  })
}

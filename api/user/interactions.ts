/**
 * User Interactions API Endpoint
 * 
 * GET /api/user/interactions - Get all likes and favorites for the authenticated user
 * 
 * Validates Requirements: 8.3, 8.8
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../lib/prisma'
import { withAuth, AuthRequest } from '../../lib/auth'

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
 * Favorite data interface
 */
interface FavoriteData {
  id: string
  assetId: string
  userId: string
  createdAt: string
}

/**
 * User interactions response
 */
interface InteractionsData {
  likes: LikeData[]
  favorites: FavoriteData[]
}

/**
 * Main interactions handler
 * Returns all likes and favorites for the authenticated user
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET method
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
    return
  }

  return handleGetInteractions(req, res)
}

/**
 * GET /api/user/interactions
 * Get all likes and favorites for the authenticated user
 * 
 * Headers: { Authorization: 'Bearer {token}' }
 * 
 * Response: { success, data: { likes: Like[], favorites: Favorite[] } }
 */
async function handleGetInteractions(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  withAuth(req as AuthRequest, res, async () => {
    try {
      const authReq = req as AuthRequest
      const userId = authReq.userId!

      // Fetch likes and favorites in parallel for better performance
      const [likes, favorites] = await Promise.all([
        prisma.like.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            assetId: true,
            userId: true,
            createdAt: true
          }
        }),
        prisma.favorite.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            assetId: true,
            userId: true,
            createdAt: true
          }
        })
      ])

      // Format the data
      const formattedLikes: LikeData[] = likes.map(like => ({
        id: like.id,
        assetId: like.assetId,
        userId: like.userId,
        createdAt: like.createdAt.toISOString()
      }))

      const formattedFavorites: FavoriteData[] = favorites.map(favorite => ({
        id: favorite.id,
        assetId: favorite.assetId,
        userId: favorite.userId,
        createdAt: favorite.createdAt.toISOString()
      }))

      const response: ApiResponse<InteractionsData> = {
        success: true,
        data: {
          likes: formattedLikes,
          favorites: formattedFavorites
        }
      }

      res.status(200).json(response)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // eslint-disable-next-line no-console
      console.error('Get interactions error:', errorMessage)
      res.status(500).json({
        success: false,
        error: '获取用户交互数据失败，请稍后重试'
      })
    }
  })
}

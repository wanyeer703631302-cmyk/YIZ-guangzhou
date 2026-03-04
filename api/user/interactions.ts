/**
 * User Interactions API Endpoint
 * 
 * GET /api/user/interactions - Get all likes and favorites for the authenticated user
 * 
 * Validates Requirements: 8.3, 8.8
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Prisma } from '@prisma/client'
// Dynamic import to avoid initialization errors
// import { prisma } from '../_lib/prisma'
import { withAuth, AuthRequest } from '../_lib/auth'

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
      // Dynamically import prisma to avoid initialization errors
      const { prisma, isDatabaseAvailable } = await import('../_lib/prisma')
      
      if (!isDatabaseAvailable) {
        // Return empty data if database is not configured
        res.status(200).json({
          success: true,
          data: {
            likes: [],
            favorites: []
          }
        })
        return
      }

      const authReq = req as AuthRequest
      const userId = authReq.userId!

      const [likes, favorites] = await Promise.all([
        prisma.$queryRaw<Array<{
          id: string
          asset_id: string
          user_id: string
          created_at: Date
        }>>(Prisma.sql`
          SELECT id, asset_id, user_id, created_at
          FROM likes
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `),
        prisma.$queryRaw<Array<{
          id: string
          asset_id: string
          user_id: string
          created_at: Date
        }>>(Prisma.sql`
          SELECT id, asset_id, user_id, created_at
          FROM favorites
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `)
      ])

      const formattedLikes: LikeData[] = likes.map(like => ({
        id: like.id,
        assetId: like.asset_id,
        userId: like.user_id,
        createdAt: like.created_at.toISOString()
      }))

      const formattedFavorites: FavoriteData[] = favorites.map(favorite => ({
        id: favorite.id,
        assetId: favorite.asset_id,
        userId: favorite.user_id,
        createdAt: favorite.created_at.toISOString()
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
      
      // Return empty data on error instead of failing
      res.status(200).json({
        success: true,
        data: {
          likes: [],
          favorites: []
        }
      })
    }
  })
}


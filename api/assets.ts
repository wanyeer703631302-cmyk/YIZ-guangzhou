/**
 * Assets API Endpoints
 * 
 * GET /api/assets - Get paginated list of assets with optional folder filtering
 * 
 * Validates Requirements: 4.3, 4.4, 9.1
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma'

/**
 * Standard API response interface
 */
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Asset data interface
 */
interface AssetData {
  id: string
  title: string
  url: string
  thumbnailUrl: string
  size: number
  folderId: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

/**
 * Paginated assets response
 */
interface AssetsResponse {
  items: AssetData[]
  total: number
  page: number
  limit: number
}

/**
 * Main assets handler
 * Routes requests to appropriate sub-handlers based on HTTP method
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    if (req.method === 'GET') {
      return await handleGetAssets(req, res)
    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed'
      })
    }
  } catch (error) {
    console.error('Assets API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * Handle GET /api/assets
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - folderId: Filter by folder ID (optional)
 * 
 * Response: { success, data: { items, total, page, limit } }
 */
async function handleGetAssets(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // Parse query parameters
    const { page: pageParam, limit: limitParam, folderId } = req.query

    // Parse and validate page number
    const page = Math.max(1, parseInt(pageParam as string) || 1)

    // Parse and validate limit (default: 20, max: 100)
    let limit = parseInt(limitParam as string) || 20
    limit = Math.min(Math.max(1, limit), 100)

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {}
    
    // Add folder filter if provided
    if (folderId && typeof folderId === 'string') {
      where.folderId = folderId
    }

    // Execute queries in parallel for better performance
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          url: true,
          thumbnailUrl: true,
          size: true,
          folderId: true,
          userId: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.asset.count({ where })
    ])

    // Format assets data
    const formattedAssets: AssetData[] = assets.map(asset => ({
      ...asset,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString()
    }))

    // Build response
    const response: ApiResponse<AssetsResponse> = {
      success: true,
      data: {
        items: formattedAssets,
        total,
        page,
        limit
      }
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Get assets error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets'
    })
  }
}

/**
 * Assets API Endpoints
 * 
 * GET /api/assets - Get paginated list of assets with optional folder filtering
 * 
 * Validates Requirements: 4.3, 4.4, 9.1
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
// Dynamic import to avoid initialization errors
// import { prisma } from '../lib/prisma'

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
 * - tagIds: Array of tag IDs for filtering (optional, AND logic)
 * 
 * Response: { success, data: { items, total, page, limit } }
 */
async function handleGetAssets(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // Dynamically import prisma to avoid initialization errors
    const { prisma, isDatabaseAvailable } = await import('../lib/prisma')
    
    if (!isDatabaseAvailable) {
      // Return empty result if database is not configured
      res.status(200).json({
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 20
        }
      })
      return
    }

    // Parse query parameters
    const { page: pageParam, limit: limitParam, folderId, tagIds: tagIdsParam } = req.query

    // Parse and validate page number
    const page = Math.max(1, parseInt(pageParam as string) || 1)

    // Parse and validate limit (default: 20, max: 100)
    let limit = parseInt(limitParam as string) || 20
    limit = Math.min(Math.max(1, limit), 100)

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Parse tagIds array
    let tagIds: string[] = []
    if (tagIdsParam) {
      if (Array.isArray(tagIdsParam)) {
        tagIds = tagIdsParam.filter(id => typeof id === 'string') as string[]
      } else if (typeof tagIdsParam === 'string') {
        tagIds = [tagIdsParam]
      }
    }

    // Build where clause for filtering
    const where: any = {}
    
    // Add folder filter if provided
    if (folderId && typeof folderId === 'string') {
      where.folderId = folderId
    }

    // Add tag filtering with AND logic if tagIds provided
    if (tagIds.length > 0) {
      // Find assets that have ALL selected tags (AND logic)
      // Use Prisma's aggregation to find assets with all specified tags
      const assetIdsWithAllTags = await prisma.assetTag.groupBy({
        by: ['assetId'],
        where: {
          tagId: {
            in: tagIds
          }
        },
        having: {
          tagId: {
            _count: {
              equals: tagIds.length
            }
          }
        }
      })

      const matchingAssetIds = assetIdsWithAllTags.map(group => group.assetId)
      
      if (matchingAssetIds.length === 0) {
        // No assets match all tags, return empty result
        res.status(200).json({
          success: true,
          data: {
            items: [],
            total: 0,
            page,
            limit
          }
        })
        return
      }

      where.id = {
        in: matchingAssetIds
      }
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
          updatedAt: true,
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  createdAt: true
                }
              }
            }
          }
        }
      }),
      prisma.asset.count({ where })
    ])

    // Format assets data with tags
    const formattedAssets: any[] = assets.map(asset => ({
      id: asset.id,
      title: asset.title,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl,
      size: asset.size,
      folderId: asset.folderId,
      userId: asset.userId,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
      tags: asset.tags.map(at => ({
        id: at.tag.id,
        name: at.tag.name,
        createdAt: at.tag.createdAt.toISOString()
      }))
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
    
    // Return empty result on error instead of failing
    res.status(200).json({
      success: true,
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 20
      }
    })
  }
}

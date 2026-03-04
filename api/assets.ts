/**
 * Assets API Endpoints
 * 
 * GET /api/assets - Get paginated list of assets with optional folder filtering
 * 
 * Validates Requirements: 4.3, 4.4, 9.1
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Prisma } from '@prisma/client'
// Dynamic import to avoid initialization errors
// import { prisma } from './_lib/prisma'

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
    const { prisma, isDatabaseAvailable } = await import('./_lib/prisma')
    
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

    const folderFilter = folderId && typeof folderId === 'string'
      ? Prisma.sql`AND a.folder_id = ${folderId}`
      : Prisma.empty

    const tagFilter = tagIds.length > 0
      ? Prisma.sql`AND a.id IN (
          SELECT at.asset_id
          FROM asset_tags at
          WHERE at.tag_id IN (${Prisma.join(tagIds)})
          GROUP BY at.asset_id
          HAVING COUNT(DISTINCT at.tag_id) = ${tagIds.length}
        )`
      : Prisma.empty

    const assets = await prisma.$queryRaw<Array<{
      id: string
      title: string
      storage_url: string
      thumbnail_url: string
      file_size: number
      folder_id: string | null
      user_id: string
      created_at: Date
    }>>(Prisma.sql`
      SELECT
        a.id,
        a.title,
        a.storage_url,
        a.thumbnail_url,
        a.file_size,
        a.folder_id,
        a.user_id,
        a.created_at
      FROM assets a
      WHERE 1 = 1
      ${folderFilter}
      ${tagFilter}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${skip}
    `)

    const totalRows = await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM assets a
      WHERE 1 = 1
      ${folderFilter}
      ${tagFilter}
    `)

    const total = totalRows[0]?.total ?? 0

    const assetIds = assets.map(asset => asset.id)
    let tagsMap = new Map<string, Array<{ id: string; name: string; createdAt: string }>>()

    if (assetIds.length > 0) {
      const tagRows = await prisma.$queryRaw<Array<{
        asset_id: string
        id: string
        name: string
        created_at: Date
      }>>(Prisma.sql`
        SELECT at.asset_id, t.id, t.name, t.created_at
        FROM asset_tags at
        INNER JOIN tags t ON t.id = at.tag_id
        WHERE at.asset_id IN (${Prisma.join(assetIds)})
      `)

      tagsMap = tagRows.reduce((map, row) => {
        const current = map.get(row.asset_id) ?? []
        current.push({
          id: row.id,
          name: row.name,
          createdAt: row.created_at.toISOString()
        })
        map.set(row.asset_id, current)
        return map
      }, new Map<string, Array<{ id: string; name: string; createdAt: string }>>())
    }

    const formattedAssets: any[] = assets.map(asset => ({
      id: asset.id,
      title: asset.title,
      url: asset.storage_url,
      thumbnailUrl: asset.thumbnail_url,
      size: asset.file_size,
      folderId: asset.folder_id,
      userId: asset.user_id,
      createdAt: asset.created_at.toISOString(),
      updatedAt: asset.created_at.toISOString(),
      tags: tagsMap.get(asset.id) ?? []
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


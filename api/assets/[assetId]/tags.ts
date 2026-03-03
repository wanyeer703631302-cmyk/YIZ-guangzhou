import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../lib/prisma'

/**
 * Asset-Tag Association API endpoints
 * 
 * POST /api/assets/:assetId/tags - Add tag to asset
 * DELETE /api/assets/:assetId/tags/:tagId - Remove tag from asset
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req

  try {
    switch (method) {
      case 'POST':
        return await addTagToAsset(req, res)
      case 'DELETE':
        return await removeTagFromAsset(req, res)
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Asset tags API error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}

/**
 * POST /api/assets/:assetId/tags
 * Add tag to asset
 */
async function addTagToAsset(req: VercelRequest, res: VercelResponse) {
  const { assetId } = req.query
  const { tagId } = req.body

  if (!assetId || typeof assetId !== 'string') {
    return res.status(400).json({
      success: false,
      error: '无效的资源ID'
    })
  }

  if (!tagId || typeof tagId !== 'string') {
    return res.status(400).json({
      success: false,
      error: '无效的标签ID'
    })
  }

  try {
    // Validate asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    })

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: '资源不存在'
      })
    }

    // Validate tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    })

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: '标签不存在'
      })
    }

    // Check if association already exists
    const existing = await prisma.assetTag.findUnique({
      where: {
        assetId_tagId: {
          assetId,
          tagId
        }
      }
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        error: '标签已关联到此资源'
      })
    }

    // Create association
    const assetTag = await prisma.assetTag.create({
      data: {
        assetId,
        tagId
      }
    })

    return res.status(201).json({
      success: true,
      data: assetTag
    })
  } catch (error) {
    console.error('Add tag to asset error:', error)
    throw error
  }
}

/**
 * DELETE /api/assets/:assetId/tags/:tagId
 * Remove tag from asset
 */
async function removeTagFromAsset(req: VercelRequest, res: VercelResponse) {
  const { assetId, tagId } = req.query

  if (!assetId || typeof assetId !== 'string') {
    return res.status(400).json({
      success: false,
      error: '无效的资源ID'
    })
  }

  if (!tagId || typeof tagId !== 'string') {
    return res.status(400).json({
      success: false,
      error: '无效的标签ID'
    })
  }

  try {
    // Check if association exists
    const existing = await prisma.assetTag.findUnique({
      where: {
        assetId_tagId: {
          assetId,
          tagId
        }
      }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '标签关联不存在'
      })
    }

    // Delete association
    await prisma.assetTag.delete({
      where: {
        assetId_tagId: {
          assetId,
          tagId
        }
      }
    })

    return res.status(200).json({
      success: true
    })
  } catch (error) {
    console.error('Remove tag from asset error:', error)
    throw error
  }
}

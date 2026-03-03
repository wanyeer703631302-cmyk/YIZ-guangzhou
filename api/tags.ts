import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma'

/**
 * Tag CRUD API endpoints
 * 
 * GET /api/tags - Get all tags with image counts
 * POST /api/tags - Create a new tag
 * PUT /api/tags/:id - Update tag name
 * DELETE /api/tags/:id - Delete tag
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req

  try {
    switch (method) {
      case 'GET':
        return await getTags(req, res)
      case 'POST':
        return await createTag(req, res)
      case 'PUT':
        return await updateTag(req, res)
      case 'DELETE':
        return await deleteTag(req, res)
      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Tags API error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    })
  }
}

/**
 * GET /api/tags
 * Get all tags with image counts
 */
async function getTags(_req: VercelRequest, res: VercelResponse) {
  try {
    // Query all tags with image counts using LEFT JOIN
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { assets: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform to include imageCount
    const tagsWithCount = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      imageCount: tag._count.assets,
      createdAt: tag.createdAt.toISOString()
    }))

    return res.status(200).json({
      success: true,
      data: tagsWithCount
    })
  } catch (error) {
    console.error('Get tags error:', error)
    throw error
  }
}

/**
 * POST /api/tags
 * Create a new tag
 */
async function createTag(req: VercelRequest, res: VercelResponse) {
  const { name } = req.body

  // Validate non-empty tag name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: '标签名称不能为空'
    })
  }

  const trimmedName = name.trim()

  try {
    // Check if tag already exists (case-insensitive)
    const existing = await prisma.tag.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        }
      }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        error: '标签名称已存在'
      })
    }

    // Create new tag
    const tag = await prisma.tag.create({
      data: {
        name: trimmedName
      }
    })

    return res.status(201).json({
      success: true,
      data: {
        id: tag.id,
        name: tag.name,
        createdAt: tag.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Create tag error:', error)
    throw error
  }
}

/**
 * PUT /api/tags/:id
 * Update tag name
 */
async function updateTag(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query
  const { name } = req.body

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: '无效的标签ID'
    })
  }

  // Validate non-empty tag name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: '标签名称不能为空'
    })
  }

  const trimmedName = name.trim()

  try {
    // Check if tag exists
    const existing = await prisma.tag.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '标签不存在'
      })
    }

    // Check if new name already exists (case-insensitive, excluding current tag)
    const duplicate = await prisma.tag.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive'
        },
        NOT: {
          id
        }
      }
    })

    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: '标签名称已存在'
      })
    }

    // Update tag name
    const updated = await prisma.tag.update({
      where: { id },
      data: { name: trimmedName }
    })

    return res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        createdAt: updated.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Update tag error:', error)
    throw error
  }
}

/**
 * DELETE /api/tags/:id
 * Delete tag and all associations
 */
async function deleteTag(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: '无效的标签ID'
    })
  }

  try {
    // Check if tag exists
    const existing = await prisma.tag.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: '标签不存在'
      })
    }

    // Delete tag (cascade deletes AssetTag records automatically)
    await prisma.tag.delete({
      where: { id }
    })

    return res.status(200).json({
      success: true
    })
  } catch (error) {
    console.error('Delete tag error:', error)
    throw error
  }
}

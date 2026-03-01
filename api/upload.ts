/**
 * Image Upload API Endpoint
 * 
 * POST /api/upload - Upload image to Cloudinary and save to database
 * 
 * Validates Requirements: 11.4, 11.8, 11.9, 1.3
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import multer from 'multer'
import { prisma } from '../lib/prisma'
import { uploadImage } from '../lib/cloudinary'
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
 * File size limit: 10MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

/**
 * Allowed image MIME types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]

/**
 * Configure Multer for memory storage
 * Files will be stored in memory as Buffer objects
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error('只支持图片格式文件 (JPEG, PNG, GIF, WebP, SVG)'))
      return
    }
    cb(null, true)
  }
})

/**
 * Promisify multer middleware for use with async/await
 */
function runMiddleware(req: any, res: any, fn: any): Promise<any> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

/**
 * Main upload handler
 * POST /api/upload
 * 
 * Headers: { Authorization: 'Bearer {token}' }
 * Body: multipart/form-data with 'file' field
 * Optional fields: title, folderId, tags (comma-separated)
 * 
 * Response: { success, data: Asset }
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
    return
  }

  // Use withAuth middleware to validate token
  withAuth(req as AuthRequest, res, async () => {
    try {
      const authReq = req as AuthRequest

      // Run multer middleware to parse multipart/form-data
      await runMiddleware(req, res, upload.single('file'))

      // Check if file was uploaded
      const file = (req as any).file
      if (!file) {
        res.status(400).json({
          success: false,
          error: '请选择要上传的文件'
        })
        return
      }

      // Validate file size (double-check even though multer has limits)
      if (file.size > MAX_FILE_SIZE) {
        res.status(413).json({
          success: false,
          error: '文件大小不能超过10MB'
        })
        return
      }

      // Validate file type (double-check even though multer has fileFilter)
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        res.status(400).json({
          success: false,
          error: '只支持图片格式文件'
        })
        return
      }

      // Extract optional metadata from request body
      const title = (req.body as any)?.title || file.originalname
      const folderId = (req.body as any)?.folderId || null
      const tagsString = (req.body as any)?.tags || ''
      const tags = tagsString ? tagsString.split(',').map((t: string) => t.trim()).filter(Boolean) : []

      // Upload to Cloudinary
      let cloudinaryResult
      try {
        cloudinaryResult = await uploadImage(file.buffer, {
          folder: 'pincollect',
          resourceType: 'image'
        })
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line no-console
        console.error('Cloudinary upload error:', errorMessage)
        res.status(500).json({
          success: false,
          error: '图片上传到云存储失败，请稍后重试'
        })
        return
      }

      // Generate thumbnail URL
      const thumbnailUrl = cloudinaryResult.secure_url.replace(
        '/upload/',
        '/upload/f_auto,q_auto,c_thumb,w_400/'
      )

      // Save asset record to database
      try {
        const asset = await prisma.asset.create({
          data: {
            title,
            url: cloudinaryResult.secure_url,
            thumbnailUrl,
            size: file.size,
            folderId,
            userId: authReq.userId!,
            // Handle tags if provided
            ...(tags.length > 0 && {
              tags: {
                create: tags.map((tagName: string) => ({
                  tag: {
                    connectOrCreate: {
                      where: { name: tagName },
                      create: { name: tagName }
                    }
                  }
                }))
              }
            })
          },
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        })

        // Format response
        const response: ApiResponse<AssetData> = {
          success: true,
          data: {
            id: asset.id,
            title: asset.title,
            url: asset.url,
            thumbnailUrl: asset.thumbnailUrl,
            size: asset.size,
            folderId: asset.folderId,
            userId: asset.userId,
            createdAt: asset.createdAt.toISOString(),
            updatedAt: asset.updatedAt.toISOString()
          }
        }

        res.status(201).json(response)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line no-console
        console.error('Database save error:', errorMessage)
        res.status(500).json({
          success: false,
          error: '保存图片记录到数据库失败'
        })
      }
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Upload error:', error)
      
      // Handle multer errors
      if (error && typeof error === 'object' && 'code' in error) {
        const multerError = error as { code: string; message: string }
        if (multerError.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({
            success: false,
            error: '文件大小不能超过10MB'
          })
          return
        }
        res.status(400).json({
          success: false,
          error: `文件上传错误: ${multerError.message}`
        })
        return
      }

      // Handle custom validation errors
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        })
        return
      }

      // Generic error
      res.status(500).json({
        success: false,
        error: '图片上传失败，请稍后重试'
      })
    }
  })
}

/**
 * Disable body parser for this endpoint
 * Multer needs to parse the multipart/form-data itself
 */
export const config = {
  api: {
    bodyParser: false
  }
}

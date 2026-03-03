import type { VercelRequest, VercelResponse } from '@vercel/node'
import multer from 'multer'
import { prisma, isDatabaseAvailable } from '../lib/prisma'
import { uploadImage, cloudinary } from '../lib/cloudinary'
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

      // Check database availability before processing upload
      if (!isDatabaseAvailable) {
        res.status(503).json({
          success: false,
          error: '数据库服务不可用，请联系管理员配置 DATABASE_URL'
        })
        return
      }

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

      // Validate userId before database save
      if (!authReq.userId) {
        res.status(401).json({
          success: false,
          error: '用户认证信息缺失'
        })
        return
      }

      // Save asset record to database using raw SQL
      try {
        // Generate UUID for the asset
        const assetId = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT gen_random_uuid()::text as id
        `
        const newAssetId = assetId[0].id

        // Insert asset record
        await prisma.$executeRaw`
          INSERT INTO assets (
            id,
            user_id,
            folder_id,
            title,
            storage_url,
            thumbnail_url,
            file_size,
            mime_type,
            source_type,
            status,
            created_at
          ) VALUES (
            ${newAssetId},
            ${authReq.userId!},
            ${folderId},
            ${title},
            ${cloudinaryResult.secure_url},
            ${thumbnailUrl},
            ${file.size},
            ${file.mimetype.split('/')[1]},
            'upload',
            'approved',
            NOW()
          )
        `

        // Verify the record was created
        const verifyAsset = await prisma.$queryRaw<Array<{
          id: string
          user_id: string
          folder_id: string | null
          title: string
          storage_url: string
          thumbnail_url: string
          file_size: number
          created_at: Date
        }>>`
          SELECT id, user_id, folder_id, title, storage_url, thumbnail_url, file_size, created_at
          FROM assets
          WHERE id = ${newAssetId}
        `

        if (verifyAsset.length === 0) {
          // eslint-disable-next-line no-console
          console.error('Database verification failed: Record not found after creation', {
            assetId: newAssetId,
            userId: authReq.userId
          })
          res.status(500).json({
            success: false,
            error: '数据库记录验证失败，请重试'
          })
          return
        }

        const asset = verifyAsset[0]

        // Format response
        const response: ApiResponse<AssetData> = {
          success: true,
          data: {
            id: asset.id,
            title: asset.title,
            url: asset.storage_url,
            thumbnailUrl: asset.thumbnail_url,
            size: asset.file_size,
            folderId: asset.folder_id,
            userId: asset.user_id,
            createdAt: asset.created_at.toISOString(),
            updatedAt: asset.created_at.toISOString()
          }
        }

        res.status(201).json(response)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        // eslint-disable-next-line no-console
        console.error('Database save error:', {
          userId: authReq.userId,
          fileSize: file.size,
          cloudinaryUrl: cloudinaryResult.secure_url,
          error: errorMessage
        })
        
        // Clean up Cloudinary upload on database failure
        try {
          await cloudinary.uploader.destroy(cloudinaryResult.public_id)
          // eslint-disable-next-line no-console
          console.log('Cloudinary cleanup successful:', cloudinaryResult.public_id)
        } catch (cleanupError: unknown) {
          const cleanupErrorMessage = cleanupError instanceof Error ? cleanupError.message : 'Unknown error'
          // eslint-disable-next-line no-console
          console.error('Cloudinary cleanup failed:', {
            publicId: cloudinaryResult.public_id,
            error: cleanupErrorMessage
          })
        }
        
        res.status(500).json({
          success: false,
          error: `保存图片记录到数据库失败: ${errorMessage}`
        })
        return
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

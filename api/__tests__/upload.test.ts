/**
 * Unit tests for Upload API endpoint
 * 
 * Tests Requirements: 11.4, 11.8, 11.9, 1.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Mock dependencies before importing handler
vi.mock('../../lib/prisma', () => ({
  prisma: {
    asset: {
      create: vi.fn()
    }
  }
}))

vi.mock('../../lib/cloudinary', () => ({
  uploadImage: vi.fn()
}))

vi.mock('../../lib/auth', () => ({
  withAuth: vi.fn((req: any, res: any, next: any) => {
    req.userId = 'test-user-id'
    return next()
  }),
  generateToken: vi.fn()
}))

vi.mock('multer', () => {
  const multer = vi.fn(() => ({
    single: vi.fn(() => (req: any, res: any, cb: any) => {
      // Simulate multer adding file to request
      cb()
    })
  }))
  multer.memoryStorage = vi.fn()
  return { default: multer }
})

import handler from '../upload'
import { prisma } from '../../lib/prisma'
import { uploadImage } from '../../lib/cloudinary'

describe('Upload API - POST /api/upload', () => {
  let mockReq: Partial<VercelRequest>
  let mockRes: Partial<VercelResponse>
  let jsonMock: ReturnType<typeof vi.fn>
  let statusMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Setup response mocks
    jsonMock = vi.fn()
    statusMock = vi.fn().mockReturnValue({ json: jsonMock })

    mockRes = {
      status: statusMock,
      json: jsonMock
    }
  })

  it('should return 405 for non-POST methods', async () => {
    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      }
    }

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    expect(statusMock).toHaveBeenCalledWith(405)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Method not allowed'
    })
  })

  it('should reject requests without file', async () => {
    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      body: {}
    } as any

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('文件')
    })
  })

  it('should reject files larger than 10MB', async () => {
    const largeFileSize = 11 * 1024 * 1024 // 11MB

    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      body: {},
      file: {
        buffer: Buffer.alloc(largeFileSize),
        originalname: 'large-image.jpg',
        mimetype: 'image/jpeg',
        size: largeFileSize
      }
    } as any

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    expect(statusMock).toHaveBeenCalledWith(413)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('10MB')
    })
  })

  it('should reject non-image files', async () => {
    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      body: {},
      file: {
        buffer: Buffer.from('test'),
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024
      }
    } as any

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('图片')
    })
  })

  it('should successfully upload valid image file', async () => {
    const mockCloudinaryResult = {
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
      public_id: 'test/test',
      format: 'jpg'
    }

    const mockAsset = {
      id: 'asset-123',
      title: 'test-image.jpg',
      url: mockCloudinaryResult.secure_url,
      thumbnailUrl: 'https://res.cloudinary.com/test/image/upload/f_auto,q_auto,c_thumb,w_400/v123/test.jpg',
      size: 1024,
      folderId: null,
      userId: 'test-user-id',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }

    // Setup mocks
    vi.mocked(uploadImage).mockResolvedValue(mockCloudinaryResult)
    vi.mocked(prisma.asset.create).mockResolvedValue(mockAsset as any)

    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      body: {},
      file: {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      }
    } as any

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify Cloudinary upload was called
    expect(uploadImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        folder: 'pincollect',
        resourceType: 'image'
      })
    )

    // Verify database save was called
    expect(prisma.asset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'test-image.jpg',
          url: mockCloudinaryResult.secure_url,
          size: 1024,
          userId: 'test-user-id'
        })
      })
    )

    // Verify success response
    expect(statusMock).toHaveBeenCalledWith(201)
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        id: 'asset-123',
        title: 'test-image.jpg',
        url: mockCloudinaryResult.secure_url
      })
    })
  })

  it('should handle Cloudinary upload errors', async () => {
    vi.mocked(uploadImage).mockRejectedValue(new Error('Cloudinary error'))

    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      body: {},
      file: {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      }
    } as any

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    expect(statusMock).toHaveBeenCalledWith(500)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('云存储')
    })
  })

  it('should handle database save errors', async () => {
    const mockCloudinaryResult = {
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
      public_id: 'test/test'
    }

    vi.mocked(uploadImage).mockResolvedValue(mockCloudinaryResult)
    vi.mocked(prisma.asset.create).mockRejectedValue(new Error('Database error'))

    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      body: {},
      file: {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      }
    } as any

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    expect(statusMock).toHaveBeenCalledWith(500)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: expect.stringContaining('数据库')
    })
  })

  it('should support optional metadata fields', async () => {
    const mockCloudinaryResult = {
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
      public_id: 'test/test'
    }

    const mockAsset = {
      id: 'asset-123',
      title: 'Custom Title',
      url: mockCloudinaryResult.secure_url,
      thumbnailUrl: 'https://res.cloudinary.com/test/image/upload/f_auto,q_auto,c_thumb,w_400/v123/test.jpg',
      size: 1024,
      folderId: 'folder-123',
      userId: 'test-user-id',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }

    vi.mocked(uploadImage).mockResolvedValue(mockCloudinaryResult)
    vi.mocked(prisma.asset.create).mockResolvedValue(mockAsset as any)

    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer valid-token'
      },
      body: {
        title: 'Custom Title',
        folderId: 'folder-123',
        tags: 'nature,landscape'
      },
      file: {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      }
    } as any

    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify metadata was used
    expect(prisma.asset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Custom Title',
          folderId: 'folder-123'
        })
      })
    )
  })

  it('should accept various image formats', async () => {
    const imageFormats = [
      { mimetype: 'image/jpeg', name: 'test.jpg' },
      { mimetype: 'image/png', name: 'test.png' },
      { mimetype: 'image/gif', name: 'test.gif' },
      { mimetype: 'image/webp', name: 'test.webp' }
    ]

    for (const format of imageFormats) {
      vi.clearAllMocks()

      const mockCloudinaryResult = {
        secure_url: `https://res.cloudinary.com/test/image/upload/v123/${format.name}`,
        public_id: `test/${format.name}`
      }

      vi.mocked(uploadImage).mockResolvedValue(mockCloudinaryResult)
      vi.mocked(prisma.asset.create).mockResolvedValue({
        id: 'asset-123',
        title: format.name,
        url: mockCloudinaryResult.secure_url,
        thumbnailUrl: mockCloudinaryResult.secure_url,
        size: 1024,
        folderId: null,
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any)

      mockReq = {
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token'
        },
        body: {},
        file: {
          buffer: Buffer.from('fake-image-data'),
          originalname: format.name,
          mimetype: format.mimetype,
          size: 1024
        }
      } as any

      await handler(mockReq as VercelRequest, mockRes as VercelResponse)

      expect(statusMock).toHaveBeenCalledWith(201)
    }
  })
})

/**
 * Unit tests for User Interactions API endpoint
 * 
 * Tests Requirements: 8.3, 8.8
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../user/interactions'
import { prisma } from '../../lib/prisma'
import * as auth from '../../lib/auth'

// Mock Prisma client
vi.mock('../../lib/prisma', () => ({
  prisma: {
    like: {
      findMany: vi.fn()
    },
    favorite: {
      findMany: vi.fn()
    }
  }
}))

// Mock auth module
vi.mock('../../lib/auth', () => ({
  withAuth: vi.fn((req, res, next) => {
    // Simulate successful authentication
    req.userId = 'test-user-id'
    next()
  })
}))

describe('User Interactions API - GET /api/user/interactions', () => {
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

  it('should return user likes and favorites', async () => {
    // Mock data
    const mockLikes = [
      {
        id: 'like-1',
        assetId: 'asset-1',
        userId: 'test-user-id',
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'like-2',
        assetId: 'asset-2',
        userId: 'test-user-id',
        createdAt: new Date('2024-01-02')
      }
    ]

    const mockFavorites = [
      {
        id: 'fav-1',
        assetId: 'asset-3',
        userId: 'test-user-id',
        createdAt: new Date('2024-01-03')
      }
    ]

    // Setup mocks
    vi.mocked(prisma.like.findMany).mockResolvedValue(mockLikes)
    vi.mocked(prisma.favorite.findMany).mockResolvedValue(mockFavorites)

    // Create request
    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        likes: [
          {
            id: 'like-1',
            assetId: 'asset-1',
            userId: 'test-user-id',
            createdAt: '2024-01-01T00:00:00.000Z'
          },
          {
            id: 'like-2',
            assetId: 'asset-2',
            userId: 'test-user-id',
            createdAt: '2024-01-02T00:00:00.000Z'
          }
        ],
        favorites: [
          {
            id: 'fav-1',
            assetId: 'asset-3',
            userId: 'test-user-id',
            createdAt: '2024-01-03T00:00:00.000Z'
          }
        ]
      }
    })

    // Verify Prisma was called with correct parameters
    expect(prisma.like.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        assetId: true,
        userId: true,
        createdAt: true
      }
    })

    expect(prisma.favorite.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        assetId: true,
        userId: true,
        createdAt: true
      }
    })
  })

  it('should return empty arrays when user has no interactions', async () => {
    // Setup mocks to return empty arrays
    vi.mocked(prisma.like.findMany).mockResolvedValue([])
    vi.mocked(prisma.favorite.findMany).mockResolvedValue([])

    // Create request
    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        likes: [],
        favorites: []
      }
    })
  })

  it('should return 405 for non-GET methods', async () => {
    // Create POST request
    mockReq = {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify error response
    expect(statusMock).toHaveBeenCalledWith(405)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Method not allowed'
    })
  })

  it('should require authentication', async () => {
    // Mock withAuth to reject authentication
    vi.mocked(auth.withAuth).mockImplementation((req, res, next) => {
      res.status(401).json({ success: false, error: 'Unauthorized' })
    })

    // Create request without auth header
    mockReq = {
      method: 'GET',
      headers: {}
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify auth was checked
    expect(auth.withAuth).toHaveBeenCalled()
  })

  it('should handle database errors gracefully', async () => {
    // Setup mock to throw error
    vi.mocked(prisma.like.findMany).mockRejectedValue(
      new Error('Database connection failed')
    )

    // Create request
    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify error response
    expect(statusMock).toHaveBeenCalledWith(500)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: '获取用户交互数据失败，请稍后重试'
    })
  })

  it('should format dates as ISO strings', async () => {
    const testDate = new Date('2024-01-15T10:30:00Z')
    
    // Mock data with specific date
    const mockLikes = [
      {
        id: 'like-1',
        assetId: 'asset-1',
        userId: 'test-user-id',
        createdAt: testDate
      }
    ]

    const mockFavorites = [
      {
        id: 'fav-1',
        assetId: 'asset-2',
        userId: 'test-user-id',
        createdAt: testDate
      }
    ]

    // Setup mocks
    vi.mocked(prisma.like.findMany).mockResolvedValue(mockLikes)
    vi.mocked(prisma.favorite.findMany).mockResolvedValue(mockFavorites)

    // Create request
    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify dates are formatted as ISO strings
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        likes: [
          expect.objectContaining({
            createdAt: testDate.toISOString()
          })
        ],
        favorites: [
          expect.objectContaining({
            createdAt: testDate.toISOString()
          })
        ]
      }
    })
  })

  it('should order results by createdAt descending', async () => {
    // Setup mocks
    vi.mocked(prisma.like.findMany).mockResolvedValue([])
    vi.mocked(prisma.favorite.findMany).mockResolvedValue([])

    // Create request
    mockReq = {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify ordering was applied
    expect(prisma.like.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' }
      })
    )

    expect(prisma.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' }
      })
    )
  })
})

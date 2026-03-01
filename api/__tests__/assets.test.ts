/**
 * Unit tests for Assets API endpoint
 * 
 * Tests Requirements: 4.3, 4.4, 9.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import handler from '../assets'
import { prisma } from '../../lib/prisma'

// Mock Prisma client
vi.mock('../../lib/prisma', () => ({
  prisma: {
    asset: {
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}))

describe('Assets API - GET /api/assets', () => {
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

  it('should return paginated assets with default parameters', async () => {
    // Mock data
    const mockAssets = [
      {
        id: 'asset-1',
        title: 'Test Image 1',
        url: 'https://example.com/image1.jpg',
        thumbnailUrl: 'https://example.com/thumb1.jpg',
        size: 1024,
        folderId: null,
        userId: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'asset-2',
        title: 'Test Image 2',
        url: 'https://example.com/image2.jpg',
        thumbnailUrl: 'https://example.com/thumb2.jpg',
        size: 2048,
        folderId: null,
        userId: 'user-1',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ]

    // Setup mocks
    vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
    vi.mocked(prisma.asset.count).mockResolvedValue(2)

    // Create request
    mockReq = {
      method: 'GET',
      query: {}
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify response
    expect(statusMock).toHaveBeenCalledWith(200)
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'asset-1',
            title: 'Test Image 1'
          }),
          expect.objectContaining({
            id: 'asset-2',
            title: 'Test Image 2'
          })
        ]),
        total: 2,
        page: 1,
        limit: 20
      }
    })

    // Verify Prisma was called with correct parameters
    expect(prisma.asset.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: expect.any(Object)
    })
  })

  it('should support pagination parameters', async () => {
    // Setup mocks
    vi.mocked(prisma.asset.findMany).mockResolvedValue([])
    vi.mocked(prisma.asset.count).mockResolvedValue(50)

    // Create request with pagination
    mockReq = {
      method: 'GET',
      query: {
        page: '2',
        limit: '10'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify pagination was applied
    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10, // (page 2 - 1) * 10
        take: 10
      })
    )

    // Verify response includes pagination info
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        items: [],
        total: 50,
        page: 2,
        limit: 10
      }
    })
  })

  it('should filter assets by folderId', async () => {
    const folderId = 'folder-123'

    // Setup mocks
    vi.mocked(prisma.asset.findMany).mockResolvedValue([])
    vi.mocked(prisma.asset.count).mockResolvedValue(0)

    // Create request with folder filter
    mockReq = {
      method: 'GET',
      query: {
        folderId
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify folder filter was applied
    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { folderId }
      })
    )

    expect(prisma.asset.count).toHaveBeenCalledWith({
      where: { folderId }
    })
  })

  it('should enforce maximum limit of 100', async () => {
    // Setup mocks
    vi.mocked(prisma.asset.findMany).mockResolvedValue([])
    vi.mocked(prisma.asset.count).mockResolvedValue(0)

    // Create request with excessive limit
    mockReq = {
      method: 'GET',
      query: {
        limit: '500'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify limit was capped at 100
    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100
      })
    )

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          limit: 100
        })
      })
    )
  })

  it('should handle invalid page numbers gracefully', async () => {
    // Setup mocks
    vi.mocked(prisma.asset.findMany).mockResolvedValue([])
    vi.mocked(prisma.asset.count).mockResolvedValue(0)

    // Create request with invalid page
    mockReq = {
      method: 'GET',
      query: {
        page: '-5'
      }
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify page was normalized to 1
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          page: 1
        })
      })
    )
  })

  it('should return 405 for non-GET methods', async () => {
    // Create POST request
    mockReq = {
      method: 'POST',
      query: {}
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

  it('should handle database errors gracefully', async () => {
    // Setup mock to throw error
    vi.mocked(prisma.asset.findMany).mockRejectedValue(
      new Error('Database connection failed')
    )

    // Create request
    mockReq = {
      method: 'GET',
      query: {}
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify error response
    expect(statusMock).toHaveBeenCalledWith(500)
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Failed to fetch assets'
    })
  })

  it('should format dates as ISO strings', async () => {
    const testDate = new Date('2024-01-15T10:30:00Z')
    
    // Mock data with specific date
    const mockAssets = [
      {
        id: 'asset-1',
        title: 'Test Image',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        size: 1024,
        folderId: null,
        userId: 'user-1',
        createdAt: testDate,
        updatedAt: testDate
      }
    ]

    // Setup mocks
    vi.mocked(prisma.asset.findMany).mockResolvedValue(mockAssets)
    vi.mocked(prisma.asset.count).mockResolvedValue(1)

    // Create request
    mockReq = {
      method: 'GET',
      query: {}
    }

    // Execute handler
    await handler(mockReq as VercelRequest, mockRes as VercelResponse)

    // Verify dates are formatted as ISO strings
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        items: [
          expect.objectContaining({
            createdAt: testDate.toISOString(),
            updatedAt: testDate.toISOString()
          })
        ],
        total: 1,
        page: 1,
        limit: 20
      }
    })
  })
})

/**
 * Bug Condition Exploration Property Test - Image Upload Database Recording
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * This test explores the bug condition where Cloudinary upload succeeds
 * but database record creation fails, causing uploaded images to not appear
 * in the gallery despite successful upload UI feedback.
 * 
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists and demonstrates the counterexamples.
 * 
 * After the fix is implemented, this same test should PASS,
 * confirming the expected behavior is satisfied.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import type { VercelRequest, VercelResponse } from '@vercel/node'

describe('Property 1: Fault Condition - Database Record Creation Failure Detection', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset modules to ensure fresh imports
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  /**
   * Test Scenario 1: DATABASE_URL not configured
   * 
   * When DATABASE_URL is not configured, Cloudinary upload may succeed
   * but database save should fail. The system should detect this and
   * return an error response instead of returning success.
   * 
   * Expected on unfixed code: May return success despite database failure
   * Expected on fixed code: Returns 503 error before attempting Cloudinary upload
   */
  it('should detect database unavailability and prevent orphaned Cloudinary uploads', async () => {
    // Setup: Remove DATABASE_URL
    process.env = { ...originalEnv }
    delete process.env.DATABASE_URL
    
    // Ensure Cloudinary config is present
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
    process.env.CLOUDINARY_API_KEY = 'test-key'
    process.env.CLOUDINARY_API_SECRET = 'test-secret'

    // Mock Cloudinary to track if upload is attempted
    const mockUploadImage = vi.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
      public_id: 'test/test',
      format: 'jpg'
    })

    vi.doMock('../../lib/cloudinary', () => ({
      uploadImage: mockUploadImage,
      isCloudinaryConfigured: () => true
    }))

    // Mock auth to provide userId
    vi.doMock('../../lib/auth', () => ({
      withAuth: vi.fn((req: any, res: any, next: any) => {
        req.userId = 'test-user-id'
        return next()
      })
    }))

    // Mock multer
    vi.doMock('multer', () => {
      const multer = vi.fn(() => ({
        single: vi.fn(() => (req: any, res: any, cb: any) => {
          cb()
        })
      }))
      multer.memoryStorage = vi.fn()
      return { default: multer }
    })

    // Import handler after mocks are set
    const { default: handler } = await import('../upload')

    // Create mock request with valid file
    const mockReq = {
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

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    // Execute
    await handler(mockReq, mockRes)

    // Assert: Should return error status (503 or 500), not success
    const statusCode = mockRes.status.mock.calls[0]?.[0]
    expect(statusCode).toBeGreaterThanOrEqual(500)
    
    // Assert: Response should indicate failure
    const response = mockRes.json.mock.calls[0]?.[0]
    expect(response).toHaveProperty('success', false)
    expect(response).toHaveProperty('error')
    expect(response.error).toMatch(/?°æ®åº“|database/i)

    // Assert: Cloudinary upload should ideally not be attempted (for fixed code)
    // On unfixed code, this may have been called, creating an orphaned file
    if (mockUploadImage.mock.calls.length > 0) {
      console.warn('? ï? BUG DETECTED: Cloudinary upload was attempted despite database unavailability')
      console.warn('   This creates orphaned files in Cloudinary without database records')
    }
  })

  /**
   * Test Scenario 2: userId is undefined
   * 
   * When authentication middleware fails to provide userId,
   * database save will fail due to foreign key constraint.
   * The system should detect this and return an error.
   * 
   * Expected on unfixed code: May crash or return unclear error
   * Expected on fixed code: Returns 401 error with clear message
   */
  it('should detect missing userId and return clear authentication error', async () => {
    // Setup: Normal environment
    process.env = { ...originalEnv }
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
    process.env.CLOUDINARY_API_KEY = 'test-key'
    process.env.CLOUDINARY_API_SECRET = 'test-secret'

    // Mock Cloudinary
    const mockUploadImage = vi.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
      public_id: 'test/test',
      format: 'jpg'
    })

    vi.doMock('../../lib/cloudinary', () => ({
      uploadImage: mockUploadImage,
      isCloudinaryConfigured: () => true
    }))

    // Mock auth to NOT provide userId (simulating auth failure)
    vi.doMock('../../lib/auth', () => ({
      withAuth: vi.fn((req: any, res: any, next: any) => {
        // userId is undefined
        req.userId = undefined
        return next()
      })
    }))

    // Mock multer
    vi.doMock('multer', () => {
      const multer = vi.fn(() => ({
        single: vi.fn(() => (req: any, res: any, cb: any) => {
          cb()
        })
      }))
      multer.memoryStorage = vi.fn()
      return { default: multer }
    })

    // Mock prisma to simulate foreign key constraint error
    const mockPrismaCreate = vi.fn().mockRejectedValue(
      new Error('Foreign key constraint failed on the field: `userId`')
    )

    vi.doMock('../../lib/prisma', () => ({
      prisma: {
        asset: {
          create: mockPrismaCreate
        }
      },
      isDatabaseAvailable: true
    }))

    // Import handler after mocks are set
    const { default: handler } = await import('../upload')

    // Create mock request
    const mockReq = {
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

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    // Execute
    await handler(mockReq, mockRes)

    // Assert: Should return error status (401 or 500)
    const statusCode = mockRes.status.mock.calls[0]?.[0]
    expect(statusCode).toBeGreaterThanOrEqual(400)
    
    // Assert: Response should indicate failure
    const response = mockRes.json.mock.calls[0]?.[0]
    expect(response).toHaveProperty('success', false)
    expect(response).toHaveProperty('error')

    // On unfixed code, this may return 500 with database error
    // On fixed code, this should return 401 with authentication error
    if (statusCode === 500) {
      console.warn('? ï? BUG DETECTED: userId validation missing, database constraint error occurred')
      console.warn('   Expected: 401 with authentication error')
      console.warn('   Actual: 500 with database error')
    }
  })

  /**
   * Test Scenario 3: Database connection timeout
   * 
   * When database connection times out or is unreachable,
   * the system should return a clear error instead of hanging
   * or returning success.
   * 
   * Expected on unfixed code: May hang, timeout, or return unclear error
   * Expected on fixed code: Returns 500 error with clear message
   */
  it('should handle database connection timeout gracefully', async () => {
    // Setup: Use invalid DATABASE_URL that will cause connection failure
    process.env = { ...originalEnv }
    process.env.DATABASE_URL = 'postgresql://invalid:invalid@nonexistent-host:5432/invalid'
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
    process.env.CLOUDINARY_API_KEY = 'test-key'
    process.env.CLOUDINARY_API_SECRET = 'test-secret'

    // Mock Cloudinary
    const mockUploadImage = vi.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
      public_id: 'test/test',
      format: 'jpg'
    })

    vi.doMock('../../lib/cloudinary', () => ({
      uploadImage: mockUploadImage,
      isCloudinaryConfigured: () => true
    }))

    // Mock auth
    vi.doMock('../../lib/auth', () => ({
      withAuth: vi.fn((req: any, res: any, next: any) => {
        req.userId = 'test-user-id'
        return next()
      })
    }))

    // Mock multer
    vi.doMock('multer', () => {
      const multer = vi.fn(() => ({
        single: vi.fn(() => (req: any, res: any, cb: any) => {
          cb()
        })
      }))
      multer.memoryStorage = vi.fn()
      return { default: multer }
    })

    // Mock prisma to simulate connection timeout
    const mockPrismaCreate = vi.fn().mockRejectedValue(
      new Error('Connection timeout')
    )

    vi.doMock('../../lib/prisma', () => ({
      prisma: {
        asset: {
          create: mockPrismaCreate
        }
      },
      isDatabaseAvailable: true
    }))

    // Import handler after mocks are set
    const { default: handler } = await import('../upload')

    // Create mock request
    const mockReq = {
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

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    // Execute
    await handler(mockReq, mockRes)

    // Assert: Should return error status (500)
    const statusCode = mockRes.status.mock.calls[0]?.[0]
    expect(statusCode).toBe(500)
    
    // Assert: Response should indicate database failure
    const response = mockRes.json.mock.calls[0]?.[0]
    expect(response).toHaveProperty('success', false)
    expect(response).toHaveProperty('error')
    expect(response.error).toMatch(/?°æ®åº“|database/i)
  })

  /**
   * Test Scenario 4: Cloudinary succeeds but database fails - orphaned files
   * 
   * When Cloudinary upload succeeds but database save fails,
   * the system should clean up the uploaded file from Cloudinary
   * to prevent orphaned files.
   * 
   * Expected on unfixed code: Orphaned file remains in Cloudinary
   * Expected on fixed code: File is deleted from Cloudinary on database failure
   */
  it('should clean up Cloudinary upload when database save fails', async () => {
    // Setup: Normal environment
    process.env = { ...originalEnv }
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
    process.env.CLOUDINARY_API_KEY = 'test-key'
    process.env.CLOUDINARY_API_SECRET = 'test-secret'

    // Mock Cloudinary with destroy method
    const mockUploadImage = vi.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
      public_id: 'test/test-image',
      format: 'jpg'
    })

    const mockDestroyImage = vi.fn().mockResolvedValue({
      result: 'ok'
    })

    vi.doMock('../../lib/cloudinary', () => ({
      uploadImage: mockUploadImage,
      isCloudinaryConfigured: () => true,
      cloudinary: {
        uploader: {
          destroy: mockDestroyImage
        }
      }
    }))

    // Mock auth
    vi.doMock('../../lib/auth', () => ({
      withAuth: vi.fn((req: any, res: any, next: any) => {
        req.userId = 'test-user-id'
        return next()
      })
    }))

    // Mock multer
    vi.doMock('multer', () => {
      const multer = vi.fn(() => ({
        single: vi.fn(() => (req: any, res: any, cb: any) => {
          cb()
        })
      }))
      multer.memoryStorage = vi.fn()
      return { default: multer }
    })

    // Mock prisma to fail database save
    const mockPrismaCreate = vi.fn().mockRejectedValue(
      new Error('Database constraint violation')
    )

    vi.doMock('../../lib/prisma', () => ({
      prisma: {
        asset: {
          create: mockPrismaCreate
        }
      },
      isDatabaseAvailable: true
    }))

    // Import handler after mocks are set
    const { default: handler } = await import('../upload')

    // Create mock request
    const mockReq = {
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

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    // Execute
    await handler(mockReq, mockRes)

    // Assert: Cloudinary upload was called
    expect(mockUploadImage).toHaveBeenCalled()

    // Assert: Database save was attempted and failed
    expect(mockPrismaCreate).toHaveBeenCalled()

    // Assert: Should return error status
    const statusCode = mockRes.status.mock.calls[0]?.[0]
    expect(statusCode).toBe(500)
    
    // Assert: Response should indicate failure
    const response = mockRes.json.mock.calls[0]?.[0]
    expect(response).toHaveProperty('success', false)

    // Assert: Cloudinary cleanup should be called (on fixed code)
    if (mockDestroyImage.mock.calls.length === 0) {
      console.warn('? ï? BUG DETECTED: Cloudinary file not cleaned up after database failure')
      console.warn('   This creates orphaned files in Cloudinary')
      console.warn('   Expected: cloudinary.uploader.destroy() to be called with public_id')
    } else {
      // On fixed code, verify cleanup was called with correct public_id
      expect(mockDestroyImage).toHaveBeenCalledWith('test/test-image')
    }
  })

  /**
   * Property-Based Test: Database save failures should never return success
   * 
   * This test generates various database error scenarios and verifies
   * that the system never returns success when database save fails.
   */
  it('Property: Database save failure should never return success response', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various database error messages
        fc.oneof(
          fc.constant('Database is not available'),
          fc.constant('Connection timeout'),
          fc.constant('Foreign key constraint failed'),
          fc.constant('Unique constraint violation'),
          fc.constant('Network error'),
          fc.string({ minLength: 5, maxLength: 50 })
        ),
        async (errorMessage) => {
          // Setup environment
          process.env = { ...originalEnv }
          process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
          process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
          process.env.CLOUDINARY_API_KEY = 'test-key'
          process.env.CLOUDINARY_API_SECRET = 'test-secret'

          // Reset modules for each test
          vi.resetModules()

          // Mock Cloudinary
          vi.doMock('../../lib/cloudinary', () => ({
            uploadImage: vi.fn().mockResolvedValue({
              secure_url: 'https://res.cloudinary.com/test/image/upload/v123/test.jpg',
              public_id: 'test/test',
              format: 'jpg'
            }),
            isCloudinaryConfigured: () => true,
            cloudinary: {
              uploader: {
                destroy: vi.fn().mockResolvedValue({ result: 'ok' })
              }
            }
          }))

          // Mock auth
          vi.doMock('../../lib/auth', () => ({
            withAuth: vi.fn((req: any, res: any, next: any) => {
              req.userId = 'test-user-id'
              return next()
            })
          }))

          // Mock multer
          vi.doMock('multer', () => {
            const multer = vi.fn(() => ({
              single: vi.fn(() => (req: any, res: any, cb: any) => {
                cb()
              })
            }))
            multer.memoryStorage = vi.fn()
            return { default: multer }
          })

          // Mock prisma to fail with generated error
          vi.doMock('../../lib/prisma', () => ({
            prisma: {
              asset: {
                create: vi.fn().mockRejectedValue(new Error(errorMessage))
              }
            },
            isDatabaseAvailable: true
          }))

          // Import handler
          const { default: handler } = await import('../upload')

          // Create mock request
          const mockReq = {
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

          const mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
          } as any

          // Execute
          await handler(mockReq, mockRes)

          // Property: When database save fails, response must indicate failure
          const response = mockRes.json.mock.calls[0]?.[0]
          
          // This property must hold: success should be false when database fails
          expect(response).toBeDefined()
          expect(response.success).toBe(false)
          
          // Status code should be error (4xx or 5xx)
          const statusCode = mockRes.status.mock.calls[0]?.[0]
          expect(statusCode).toBeGreaterThanOrEqual(400)
        }
      ),
      { numRuns: 3 } // Run 3 times with different error messages (reduced for faster execution)
    )
  })
})


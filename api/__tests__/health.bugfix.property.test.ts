/**
 * Bug Condition Exploration Property Test
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * This test explores the bug condition where missing environment variables
 * or service failures cause FUNCTION_INVOCATION_FAILED errors.
 * 
 * CRITICAL: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists and demonstrates the counterexamples.
 * 
 * After the fix is implemented, this same test should PASS,
 * confirming the expected behavior is satisfied.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'

describe('Property 1: Fault Condition - Graceful Error Handling', () => {
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
   * Test Scenario 1: DATABASE_URL missing
   * 
   * When DATABASE_URL is not configured, the health check endpoint
   * should return HTTP 503 with a friendly error message instead of
   * causing FUNCTION_INVOCATION_FAILED.
   */
  it('should return HTTP 503 when DATABASE_URL is missing', async () => {
    // Setup: Remove DATABASE_URL
    process.env = { ...originalEnv }
    delete process.env.DATABASE_URL
    
    // Ensure other required env vars are present
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
    process.env.CLOUDINARY_API_KEY = 'test-key'
    process.env.CLOUDINARY_API_SECRET = 'test-secret'

    // Import handler after environment is set
    const { default: handler } = await import('../health')

    // Create mock request and response
    const mockReq = {
      method: 'GET',
    } as any

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    // Execute
    await handler(mockReq, mockRes)

    // Assert: Should return HTTP 503 (not crash with FUNCTION_INVOCATION_FAILED)
    expect(mockRes.status).toHaveBeenCalledWith(503)
    
    // Assert: Should return error information
    expect(mockRes.json).toHaveBeenCalled()
    const response = mockRes.json.mock.calls[0][0]
    
    expect(response).toHaveProperty('status', 'error')
    expect(response).toHaveProperty('services')
    expect(response.services).toHaveProperty('database', 'disconnected')
    expect(response).toHaveProperty('message')
    expect(response.message).toContain('database')
  })

  /**
   * Test Scenario 2: Cloudinary configuration missing
   * 
   * When Cloudinary environment variables are not configured,
   * the health check should return HTTP 503 with error details
   * instead of causing FUNCTION_INVOCATION_FAILED.
   */
  it('should return HTTP 503 when Cloudinary config is missing', async () => {
    // Setup: Remove Cloudinary config
    process.env = { ...originalEnv }
    delete process.env.CLOUDINARY_CLOUD_NAME
    delete process.env.CLOUDINARY_API_KEY
    delete process.env.CLOUDINARY_API_SECRET
    
    // Ensure DATABASE_URL is present
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

    // Import handler after environment is set
    const { default: handler } = await import('../health')

    // Create mock request and response
    const mockReq = {
      method: 'GET',
    } as any

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    // Execute
    await handler(mockReq, mockRes)

    // Assert: Should return HTTP 503 (not crash)
    expect(mockRes.status).toHaveBeenCalledWith(503)
    
    // Assert: Should return error information
    const response = mockRes.json.mock.calls[0][0]
    
    expect(response).toHaveProperty('status', 'error')
    expect(response).toHaveProperty('services')
    expect(response.services).toHaveProperty('cloudinary', 'not configured')
    expect(response).toHaveProperty('message')
    expect(response.message).toContain('cloudinary')
  })

  /**
   * Test Scenario 3: Database connection failure
   * 
   * When the database connection fails (invalid URL or unreachable),
   * the health check should return HTTP 503 with connection error
   * instead of causing FUNCTION_INVOCATION_FAILED.
   */
  it('should return HTTP 503 when database connection fails', async () => {
    // Setup: Use invalid DATABASE_URL
    process.env = { ...originalEnv }
    process.env.DATABASE_URL = 'postgresql://invalid:invalid@nonexistent:5432/invalid'
    
    // Ensure Cloudinary config is present
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
    process.env.CLOUDINARY_API_KEY = 'test-key'
    process.env.CLOUDINARY_API_SECRET = 'test-secret'

    // Import handler after environment is set
    const { default: handler } = await import('../health')

    // Create mock request and response
    const mockReq = {
      method: 'GET',
    } as any

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    // Execute
    await handler(mockReq, mockRes)

    // Assert: Should return HTTP 503 (not crash)
    expect(mockRes.status).toHaveBeenCalledWith(503)
    
    // Assert: Should return error information
    const response = mockRes.json.mock.calls[0][0]
    
    expect(response).toHaveProperty('status', 'error')
    expect(response).toHaveProperty('services')
    expect(response.services).toHaveProperty('database', 'disconnected')
    expect(response).toHaveProperty('message')
  })

  /**
   * Test Scenario 4: All environment variables missing
   * 
   * When both DATABASE_URL and Cloudinary config are missing,
   * the system should return HTTP 503 with comprehensive error details
   * instead of causing FUNCTION_INVOCATION_FAILED.
   */
  it('should return HTTP 503 when all configs are missing', async () => {
    // Setup: Remove all environment variables
    process.env = { ...originalEnv }
    delete process.env.DATABASE_URL
    delete process.env.CLOUDINARY_CLOUD_NAME
    delete process.env.CLOUDINARY_API_KEY
    delete process.env.CLOUDINARY_API_SECRET

    // Import handler after environment is set
    const { default: handler } = await import('../health')

    // Create mock request and response
    const mockReq = {
      method: 'GET',
    } as any

    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any

    // Execute
    await handler(mockReq, mockRes)

    // Assert: Should return HTTP 503 (not crash)
    expect(mockRes.status).toHaveBeenCalledWith(503)
    
    // Assert: Should return error information for both services
    const response = mockRes.json.mock.calls[0][0]
    
    expect(response).toHaveProperty('status', 'error')
    expect(response).toHaveProperty('services')
    expect(response.services).toHaveProperty('database', 'disconnected')
    expect(response.services).toHaveProperty('cloudinary', 'not configured')
    expect(response).toHaveProperty('message')
    expect(response.message).toContain('database')
    expect(response.message).toContain('cloudinary')
  })
})

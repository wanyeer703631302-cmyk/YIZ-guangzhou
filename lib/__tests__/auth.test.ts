import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateToken, withAuth, AuthRequest } from '../auth'
import jwt from 'jsonwebtoken'
import { Response, NextFunction } from 'express'

describe('Authentication Module', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'user-123'
      const token = generateToken(userId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate token with correct userId', () => {
      const userId = 'user-456'
      const token = generateToken(userId)

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      expect(decoded.userId).toBe(userId)
    })

    it('should generate token with 7 day expiration', () => {
      const userId = 'user-789'
      const token = generateToken(userId)

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
      expect(decoded.exp).toBeDefined()
      
      // Check that expiration is approximately 7 days from now
      const now = Math.floor(Date.now() / 1000)
      const sevenDays = 7 * 24 * 60 * 60
      expect(decoded.exp).toBeGreaterThan(now)
      expect(decoded.exp).toBeLessThanOrEqual(now + sevenDays + 10) // +10 for timing tolerance
    })
  })

  describe('withAuth middleware', () => {
    let mockReq: Partial<AuthRequest>
    let mockRes: Partial<Response>
    let mockNext: NextFunction

    beforeEach(() => {
      mockReq = {
        headers: {}
      }
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      }
      mockNext = vi.fn()
    })

    it('should reject requests without authorization header', () => {
      withAuth(mockReq as AuthRequest, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject requests with invalid token', () => {
      mockReq.headers = {
        authorization: 'Bearer invalid-token'
      }

      withAuth(mockReq as AuthRequest, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should accept requests with valid token', () => {
      const userId = 'user-valid'
      const token = generateToken(userId)
      mockReq.headers = {
        authorization: `Bearer ${token}`
      }

      withAuth(mockReq as AuthRequest, mockRes as Response, mockNext)

      expect(mockReq.userId).toBe(userId)
      expect(mockNext).toHaveBeenCalled()
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).not.toHaveBeenCalled()
    })

    it('should extract userId from token and attach to request', () => {
      const userId = 'user-extract-test'
      const token = generateToken(userId)
      mockReq.headers = {
        authorization: `Bearer ${token}`
      }

      withAuth(mockReq as AuthRequest, mockRes as Response, mockNext)

      expect(mockReq.userId).toBe(userId)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should handle token without Bearer prefix', () => {
      mockReq.headers = {
        authorization: 'invalid-format-token'
      }

      withAuth(mockReq as AuthRequest, mockRes as Response, mockNext)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      })
      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})

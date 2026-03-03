/**
 * Session Validation Endpoint
 * GET /api/auth/session
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../_lib/prisma'
import { withAuth, AuthRequest } from '../_lib/auth'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

interface UserData {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET requests
  if (req.method !== 'GET') {
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
      
      // Get user from database using raw SQL
      const users = await prisma.$queryRaw<Array<{
        id: string
        email: string
        username: string
        created_at: Date
        updated_at: Date
      }>>`
        SELECT id, email, username, created_at, updated_at
        FROM users
        WHERE id = ${authReq.userId}
      `

      if (users.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        })
        return
      }

      const user = users[0]

      // Return user data with mapped field names
      const response: ApiResponse<{ user: UserData }> = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.username,
            createdAt: user.created_at.toISOString(),
            updatedAt: user.updated_at.toISOString()
          }
        }
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('Session validation error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to validate session'
      })
    }
  })
}


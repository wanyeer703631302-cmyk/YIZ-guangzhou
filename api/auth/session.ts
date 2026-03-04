/**
 * Session Validation Endpoint
 * GET /api/auth/session
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
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
  role?: 'ADMIN' | 'USER'
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
    const authReq = req as AuthRequest

    const response: ApiResponse<{ user: UserData }> = {
      success: true,
      data: {
        user: {
          id: authReq.userId!,
          email: '',
          name: '',
          role: authReq.userRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    }

    res.status(200).json(response)
  })
}


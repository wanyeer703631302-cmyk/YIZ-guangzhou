/**
 * Authentication API Endpoints
 * 
 * POST /api/auth/register - User registration
 * POST /api/auth/login - User login
 * GET /api/auth/session - Session validation
 * 
 * Validates Requirements: 10.3, 10.4, 10.8
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { generateToken, withAuth, AuthRequest } from '../lib/auth'

/**
 * Standard API response interface
 */
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * User response data (without password)
 */
interface UserData {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

/**
 * Authentication response with user and token
 */
interface AuthResponse {
  user: UserData
  token: string
}



/**
 * Main authentication handler
 * Routes requests to appropriate sub-handlers based on URL path
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // Log the incoming request for debugging
    console.log('Auth API called:', req.url, req.method)
    
    // Extract the endpoint from the URL
    const path = req.url?.split('?')[0] || ''
    
    console.log('Parsed path:', path)
    
    if (path.endsWith('/register') || path === '/register') {
      return await handleRegister(req, res)
    } else if (path.endsWith('/login') || path === '/login') {
      return await handleLogin(req, res)
    } else if (path.endsWith('/session') || path === '/session') {
      return await handleSession(req as AuthRequest, res)
    } else {
      console.log('No matching route for path:', path)
      res.status(404).json({
        success: false,
        error: `Endpoint not found: ${path}`
      })
    }
  } catch (error) {
    console.error('Auth API error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

/**
 * Handle user registration
 * POST /api/auth/register
 * 
 * DISABLED: Registration is now handled by administrators only
 */
async function handleRegister(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Registration endpoint is disabled
  res.status(410).json({
    success: false,
    error: 'Public registration is disabled. Please contact an administrator to create an account.'
  })
  return
}

/**
 * Handle user login
 * POST /api/auth/login
 * 
 * Request body: { email, password }
 * Response: { success, data: { user, token, requirePasswordChange } }
 */
async function handleLogin(
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

  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
      return
    }

    // Find user by email using raw SQL to match actual database schema
    const users = await prisma.$queryRaw<Array<{
      id: string
      email: string
      username: string
      password_hash: string | null
      role: string
      is_displayed: boolean
      created_at: Date
      updated_at: Date
    }>>`
      SELECT id, email, username, password_hash, role, is_displayed, created_at, updated_at
      FROM users
      WHERE email = ${email}
    `

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    const user = users[0]

    // Check if user account is displayed (active)
    if (!user.is_displayed) {
      res.status(403).json({
        success: false,
        error: 'Account is disabled'
      })
      return
    }

    // Check if password hash exists
    if (!user.password_hash) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    // Generate JWT token with role (no requirePasswordChange in actual DB)
    const token = generateToken(user.id, user.role as any, false)

    // Return success response with mapped field names
    const response: ApiResponse<AuthResponse & { requirePasswordChange: boolean, role: string }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.username,
          createdAt: user.created_at.toISOString(),
          updatedAt: user.updated_at.toISOString()
        },
        token,
        requirePasswordChange: false,
        role: user.role
      }
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    })
  }
}

/**
 * Handle session validation
 * GET /api/auth/session
 * 
 * Headers: { Authorization: 'Bearer {token}' }
 * Response: { success, data: { user } }
 */
async function handleSession(
  req: AuthRequest,
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
  withAuth(req, res, async () => {
    try {
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
        WHERE id = ${req.userId}
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

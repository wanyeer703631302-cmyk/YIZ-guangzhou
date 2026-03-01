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
 * Remove password from user object
 */
function sanitizeUser(user: any): UserData {
  const { password, ...userWithoutPassword } = user
  return {
    ...userWithoutPassword,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
function isValidPassword(password: string): boolean {
  // At least 6 characters
  return password.length >= 6
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
    // Extract the endpoint from the URL
    const path = req.url?.split('?')[0] || ''
    
    if (path.endsWith('/register')) {
      return await handleRegister(req, res)
    } else if (path.endsWith('/login')) {
      return await handleLogin(req, res)
    } else if (path.endsWith('/session')) {
      return await handleSession(req as AuthRequest, res)
    } else {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
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
 * Request body: { email, password, name }
 * Response: { success, data: { user, token } }
 */
async function handleRegister(
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
    const { email, password, name } = req.body

    // Validate required fields
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      })
      return
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format'
      })
      return
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      })
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      })
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    // Generate JWT token
    const token = generateToken(user.id)

    // Return success response
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: sanitizeUser(user),
        token
      }
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    })
  }
}

/**
 * Handle user login
 * POST /api/auth/login
 * 
 * Request body: { email, password }
 * Response: { success, data: { user, token } }
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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    // Generate JWT token
    const token = generateToken(user.id)

    // Return success response
    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: sanitizeUser(user),
        token
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
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: req.userId }
      })

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        })
        return
      }

      // Return user data
      const response: ApiResponse<{ user: UserData }> = {
        success: true,
        data: {
          user: sanitizeUser(user)
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

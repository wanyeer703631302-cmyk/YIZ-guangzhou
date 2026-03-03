/**
 * User Login Endpoint
 * POST /api/auth/login
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { generateToken } from '../../lib/auth'

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

interface AuthResponse {
  user: UserData
  token: string
}

export default async function handler(
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

    // Generate JWT token with role
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

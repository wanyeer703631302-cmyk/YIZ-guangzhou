/**
 * User Login Endpoint
 * POST /api/auth/login
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { prisma } from '../_lib/prisma'
import { generateToken } from '../_lib/auth'

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

type LoginRow = {
  id: string
  email: string
  username: string | null
  password_hash: string
  role: string | null
  created_at: Date
  updated_at: Date
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
    console.log('Login attempt started')
    
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      console.log('Missing email or password')
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
      return
    }

    console.log('Attempting to query user:', email)
    const users = await prisma.$queryRaw<LoginRow[]>`
      SELECT
        id,
        email,
        username,
        password_hash,
        role,
        created_at,
        updated_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
    const user = users[0]

    if (!user) {
      console.log('User not found')
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    const normalizedRole = user.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
    const requirePasswordChange = false

    console.log('User found:', user.id, 'role:', normalizedRole)

    console.log('Verifying password')
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      console.log('Password verification failed')
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    console.log('Password verified, generating token')
    const token = generateToken(user.id, normalizedRole, requirePasswordChange)

    console.log('Token generated successfully')
    const response: ApiResponse<AuthResponse & { requirePasswordChange: boolean, role: string }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.username || user.email,
          createdAt: user.created_at.toISOString(),
          updatedAt: user.updated_at.toISOString()
        },
        token,
        requirePasswordChange,
        role: normalizedRole
      }
    }

    res.status(200).json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Login error:', message)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')

    const isDbConnectivityError = message.includes('P1001') || message.includes("Can't reach database server")
    if (isDbConnectivityError) {
      res.status(503).json({ success: false, error: '数据库连接暂时不可用，请稍后重试' })
      return
    }

    res.status(500).json({ success: false, error: 'Failed to login' })
  }
}


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
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        requirePasswordChange: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      console.log('User not found')
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    console.log('User found:', user.id, 'role:', user.role)

    if (!user.isActive) {
      console.log('User account is disabled')
      res.status(403).json({
        success: false,
        error: 'Account is disabled'
      })
      return
    }

    console.log('Verifying password')
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log('Password verification failed')
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      })
      return
    }

    console.log('Password verified, generating token')
    const token = generateToken(user.id, user.role, user.requirePasswordChange)

    console.log('Token generated successfully')
    const response: ApiResponse<AuthResponse & { requirePasswordChange: boolean, role: string }> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        },
        token,
        requirePasswordChange: user.requirePasswordChange,
        role: user.role
      }
    }

    res.status(200).json(response)
  } catch (error) {
    console.error('Login error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    res.status(500).json({
      success: false,
      error: 'Failed to login: ' + (error instanceof Error ? error.message : 'Unknown error')
    })
  }
}


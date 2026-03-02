/**
 * Health Check API Endpoint
 * 
 * GET /api/health
 * 
 * Returns the health status of the application and its dependencies:
 * - Database connection status
 * - Cloudinary configuration status
 * - Environment variables validation
 * 
 * Validates Requirements: 1.5, 12.3, 12.4, 12.6, 2.3, 3.3
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'ok' | 'error'
  services: {
    database: 'connected' | 'disconnected'
    cloudinary: 'configured' | 'not configured'
  }
  timestamp: string
  message?: string
}

/**
 * Timeout duration for database connection check (in milliseconds)
 */
const DB_CONNECTION_TIMEOUT = 5000

/**
 * Health check handler
 * 
 * Checks the status of all critical services and returns a standardized response
 */
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

  try {
    // Dynamically import dependencies to handle import errors gracefully
    let getDatabaseStatus: any
    let isDatabaseAvailable: boolean = false
    let isCloudinaryConfigured: any

    try {
      const prismaModule = await import('../lib/prisma')
      getDatabaseStatus = prismaModule.getDatabaseStatus
      isDatabaseAvailable = prismaModule.isDatabaseAvailable
    } catch (error) {
      console.error('Failed to import prisma module:', error)
      getDatabaseStatus = async () => ({ connected: false, error: 'Prisma module failed to load' })
      isDatabaseAvailable = false
    }

    try {
      const cloudinaryModule = await import('../lib/cloudinary')
      isCloudinaryConfigured = cloudinaryModule.isCloudinaryConfigured
    } catch (error) {
      console.error('Failed to import cloudinary module:', error)
      isCloudinaryConfigured = () => false
    }

    // Check database status with timeout
    const checkDatabaseWithTimeout = async (): Promise<'connected' | 'disconnected'> => {
      if (!isDatabaseAvailable) {
        return 'disconnected'
      }

      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Database connection timeout')), DB_CONNECTION_TIMEOUT)
        })

        const dbStatus = await Promise.race([
          getDatabaseStatus(),
          timeoutPromise
        ])

        return dbStatus.connected ? 'connected' : 'disconnected'
      } catch (error) {
        console.error('Database connection check error:', error)
        return 'disconnected'
      }
    }

    // Check Cloudinary configuration status
    const checkCloudinaryStatus = (): 'configured' | 'not configured' => {
      try {
        return isCloudinaryConfigured() ? 'configured' : 'not configured'
      } catch (error) {
        console.error('Cloudinary configuration check error:', error)
        return 'not configured'
      }
    }

    // Check all services with error handling
    const [databaseStatus, cloudinaryStatus] = await Promise.all([
      checkDatabaseWithTimeout().catch(error => {
        console.error('Database check failed:', error)
        return 'disconnected' as const
      }),
      Promise.resolve(checkCloudinaryStatus())
    ])

    // Build response with service status
    const response: HealthCheckResponse = {
      status: 'ok',
      services: {
        database: databaseStatus,
        cloudinary: cloudinaryStatus
      },
      timestamp: new Date().toISOString()
    }

    // Determine overall status and HTTP status code
    let httpStatusCode = 200
    const issues: string[] = []

    // Check database status
    if (databaseStatus === 'disconnected') {
      response.status = 'error'
      httpStatusCode = 503
      if (!isDatabaseAvailable) {
        issues.push('database: DATABASE_URL not configured')
      } else {
        issues.push('database: connection failed')
      }
    }

    // Check Cloudinary status
    if (cloudinaryStatus === 'not configured') {
      response.status = 'error'
      // Only set to 503 if not already set (database takes precedence)
      if (httpStatusCode === 200) {
        httpStatusCode = 503
      }
      issues.push('cloudinary: not configured')
    }

    // Add summary message if there are issues
    if (issues.length > 0) {
      response.message = `Service issues detected: ${issues.join(', ')}`
    }

    res.status(httpStatusCode).json(response)
  } catch (error) {
    // Handle unexpected errors with detailed information
    console.error('Health check error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    res.status(500).json({
      status: 'error',
      services: {
        database: 'disconnected',
        cloudinary: 'not configured'
      },
      timestamp: new Date().toISOString(),
      message: `Health check failed due to internal error: ${errorMessage}`
    })
  }
}

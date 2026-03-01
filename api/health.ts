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
 * Validates Requirements: 1.5, 12.3, 12.4, 12.6
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDatabaseStatus } from '../lib/prisma'
import { isCloudinaryConfigured } from '../lib/cloudinary'

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
    // Check database connection status
    const dbStatus = await getDatabaseStatus()
    const databaseStatus = dbStatus.connected ? 'connected' : 'disconnected'

    // Check Cloudinary configuration status
    const cloudinaryStatus = isCloudinaryConfigured() 
      ? 'configured' 
      : 'not configured'

    // Determine overall health status
    const overallStatus = dbStatus.connected && isCloudinaryConfigured()
      ? 'ok'
      : 'error'

    // Build response
    const response: HealthCheckResponse = {
      status: overallStatus,
      services: {
        database: databaseStatus,
        cloudinary: cloudinaryStatus
      },
      timestamp: new Date().toISOString()
    }

    // Add error message if any service is down
    if (overallStatus === 'error') {
      const issues: string[] = []
      if (!dbStatus.connected) {
        issues.push('database connection failed')
      }
      if (!isCloudinaryConfigured()) {
        issues.push('cloudinary not configured')
      }
      response.message = `Service issues detected: ${issues.join(', ')}`
    }

    // Return appropriate status code
    const statusCode = overallStatus === 'ok' ? 200 : 503

    res.status(statusCode).json(response)
  } catch (error) {
    // Handle unexpected errors
    console.error('Health check error:', error)
    
    res.status(500).json({
      status: 'error',
      services: {
        database: 'disconnected',
        cloudinary: 'not configured'
      },
      timestamp: new Date().toISOString(),
      message: 'Health check failed due to internal error'
    })
  }
}

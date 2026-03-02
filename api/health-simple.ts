/**
 * Simplified Health Check API Endpoint
 * 
 * GET /api/health-simple
 * 
 * Returns basic health status without external dependencies
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
    return
  }

  try {
    // Check environment variables
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const hasCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )

    const response = {
      status: hasDatabaseUrl && hasCloudinary ? 'ok' : 'error',
      services: {
        database: hasDatabaseUrl ? 'configured' : 'not configured',
        cloudinary: hasCloudinary ? 'configured' : 'not configured'
      },
      timestamp: new Date().toISOString(),
      message: !hasDatabaseUrl || !hasCloudinary 
        ? `Missing configuration: ${[
            !hasDatabaseUrl && 'DATABASE_URL',
            !hasCloudinary && 'Cloudinary'
          ].filter(Boolean).join(', ')}`
        : undefined
    }

    const httpStatusCode = response.status === 'ok' ? 200 : 503

    res.status(httpStatusCode).json({
      success: httpStatusCode === 200,
      data: response
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    res.status(500).json({
      success: false,
      error: `Health check failed: ${errorMessage}`,
      data: {
        status: 'error',
        services: {
          database: 'unknown',
          cloudinary: 'unknown'
        },
        timestamp: new Date().toISOString()
      }
    })
  }
}

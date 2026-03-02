/**
 * Debug API Endpoint
 * 
 * GET /api/debug
 * 
 * Returns environment and configuration status for debugging
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    const debug = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasCloudinaryName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasCloudinaryKey: !!process.env.CLOUDINARY_API_KEY,
        hasCloudinarySecret: !!process.env.CLOUDINARY_API_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET,
      },
      method: req.method,
      url: req.url,
    }

    res.status(200).json({
      success: true,
      data: debug
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

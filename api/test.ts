/**
 * Simple Test API Endpoint
 * 
 * GET /api/test
 * 
 * Returns a simple response to verify deployment is working
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  res.status(200).json({
    success: true,
    message: 'API is working! Deployment successful.',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  })
}

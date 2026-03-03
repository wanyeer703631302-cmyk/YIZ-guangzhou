/**
 * User Registration Endpoint
 * POST /api/auth/register
 * 
 * DISABLED: Registration is now handled by administrators only
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  _req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Registration endpoint is disabled
  res.status(410).json({
    success: false,
    error: 'Public registration is disabled. Please contact an administrator to create an account.'
  })
}

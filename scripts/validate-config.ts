#!/usr/bin/env node
/**
 * Configuration Validation Script
 * 
 * This script validates the backend configuration before deployment.
 * It checks:
 * - All required environment variables are set
 * - Database connection is working
 * - Cloudinary is properly configured
 * 
 * Usage: npm run validate:config
 * 
 * Validates Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { validateConfigurationOrExit } from '../lib/config-validator'

// Run validation
validateConfigurationOrExit()
  .then(() => {
    console.log('Configuration validation completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Configuration validation failed:', error)
    process.exit(1)
  })

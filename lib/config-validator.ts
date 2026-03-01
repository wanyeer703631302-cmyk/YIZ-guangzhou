/**
 * Configuration Validator
 * 
 * Validates all required environment variables on backend startup
 * Logs errors and refuses to start if configuration is missing
 * Tests database and Cloudinary connections
 * 
 * Validates Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { testDatabaseConnection } from './prisma'
import { isCloudinaryConfigured } from './cloudinary'

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'JWT_SECRET',
] as const

/**
 * Configuration validation result
 */
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate that all required environment variables are set
 * 
 * @returns Validation result with any missing variables
 */
function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for missing required variables
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key])

  if (missing.length > 0) {
    errors.push(`Missing required environment variables: ${missing.join(', ')}`)
    errors.push('Please check your .env file and ensure all required variables are set')
    errors.push('See .env.example for a template')
  }

  // Warn about development mode
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('Running in development mode')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Test database connection
 * 
 * @returns Validation result with connection status
 */
async function validateDatabaseConnection(): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const isConnected = await testDatabaseConnection()

    if (!isConnected) {
      errors.push('Database connection failed')
      errors.push('Please check your DATABASE_URL environment variable')
      errors.push('Ensure the database server is running and accessible')
    }
  } catch (error) {
    errors.push('Database connection test failed')
    errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Test Cloudinary configuration
 * 
 * @returns Validation result with configuration status
 */
function validateCloudinaryConfiguration(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isCloudinaryConfigured()) {
    errors.push('Cloudinary is not properly configured')
    errors.push('Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate all configuration requirements
 * 
 * This function performs comprehensive validation of:
 * - Environment variables
 * - Database connection
 * - Cloudinary configuration
 * 
 * @returns Overall validation result
 */
export async function validateConfiguration(): Promise<ValidationResult> {
  console.log('🔍 Validating configuration...')

  const allErrors: string[] = []
  const allWarnings: string[] = []

  // Step 1: Validate environment variables
  console.log('  ├─ Checking environment variables...')
  const envResult = validateEnvironmentVariables()
  allErrors.push(...envResult.errors)
  allWarnings.push(...envResult.warnings)

  if (envResult.valid) {
    console.log('  │  ✓ All required environment variables are set')
  } else {
    console.log('  │  ✗ Environment variable validation failed')
    envResult.errors.forEach(error => console.error(`  │    - ${error}`))
  }

  // Step 2: Test database connection (only if env vars are valid)
  if (envResult.valid) {
    console.log('  ├─ Testing database connection...')
    const dbResult = await validateDatabaseConnection()
    allErrors.push(...dbResult.errors)
    allWarnings.push(...dbResult.warnings)

    if (dbResult.valid) {
      console.log('  │  ✓ Database connection successful')
    } else {
      console.log('  │  ✗ Database connection failed')
      dbResult.errors.forEach(error => console.error(`  │    - ${error}`))
    }
  }

  // Step 3: Test Cloudinary configuration (only if env vars are valid)
  if (envResult.valid) {
    console.log('  └─ Testing Cloudinary configuration...')
    const cloudinaryResult = validateCloudinaryConfiguration()
    allErrors.push(...cloudinaryResult.errors)
    allWarnings.push(...cloudinaryResult.warnings)

    if (cloudinaryResult.valid) {
      console.log('     ✓ Cloudinary configuration valid')
    } else {
      console.log('     ✗ Cloudinary configuration invalid')
      cloudinaryResult.errors.forEach(error => console.error(`       - ${error}`))
    }
  }

  // Display warnings
  if (allWarnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    allWarnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  // Final result
  const isValid = allErrors.length === 0

  if (isValid) {
    console.log('\n✅ Configuration validation passed\n')
  } else {
    console.error('\n❌ Configuration validation failed\n')
    console.error('Errors:')
    allErrors.forEach(error => console.error(`  - ${error}`))
    console.error('\nThe application cannot start with invalid configuration.')
    console.error('Please fix the errors above and try again.\n')
  }

  return {
    valid: isValid,
    errors: allErrors,
    warnings: allWarnings,
  }
}

/**
 * Validate configuration and exit if invalid
 * 
 * This is a convenience function that validates configuration
 * and exits the process with code 1 if validation fails.
 * 
 * Use this in your application startup code.
 */
export async function validateConfigurationOrExit(): Promise<void> {
  const result = await validateConfiguration()

  if (!result.valid) {
    process.exit(1)
  }
}
